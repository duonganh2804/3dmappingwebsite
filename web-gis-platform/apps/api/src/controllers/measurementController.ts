import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AuthRequest } from '../middlewares/authMiddleware';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
});
const prisma = new PrismaClient({ adapter });

const measurementTypes = new Set([
  'point', 'distance', 'height', 'angle', 'circle', 'sphere', 'azimuth',
  'area', 'volume', 'profile', 'annotation'
]);

const validPositions = (value: unknown): value is Array<{ x: number; y: number; z: number }> =>
  Array.isArray(value) && value.length > 0 && value.every(position =>
    position && typeof position === 'object' &&
    Number.isFinite((position as any).x) &&
    Number.isFinite((position as any).y) &&
    Number.isFinite((position as any).z)
  );

export const listMeasurements = async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.measurement.findMany({
      where: { projectId: String(req.params.projectId) },
      orderBy: { createdAt: 'asc' }
    });
    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createMeasurement = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { id, type, positions, value, label, visible, metadata } = req.body || {};
    if (!id || !measurementTypes.has(type) || !validPositions(positions)) {
      return res.status(400).json({ error: 'Measurement payload không hợp lệ' });
    }
    const record = await prisma.measurement.create({
      data: {
        id: String(id), projectId, type, positions, value: value ?? null,
        label: label ?? null, visible: visible !== false, metadata: metadata ?? undefined,
        createdById: req.user?.id
      }
    });
    return res.status(201).json(record);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateMeasurement = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const id = String(req.params.measurementId);
    const existing = await prisma.measurement.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy measurement' });
    const { positions, value, label, visible, metadata } = req.body || {};
    if (positions !== undefined && !validPositions(positions)) {
      return res.status(400).json({ error: 'Measurement positions không hợp lệ' });
    }
    const record = await prisma.measurement.update({
      where: { id },
      data: {
        ...(positions !== undefined ? { positions } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(visible !== undefined ? { visible: Boolean(visible) } : {}),
        ...(metadata !== undefined ? { metadata } : {})
      }
    });
    return res.json(record);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteMeasurement = async (req: AuthRequest, res: Response) => {
  const result = await prisma.measurement.deleteMany({
    where: { id: String(req.params.measurementId), projectId: String(req.params.projectId) }
  });
  if (result.count === 0) return res.status(404).json({ error: 'Không tìm thấy measurement' });
  return res.json({ success: true });
};

export const clearMeasurements = async (req: AuthRequest, res: Response) => {
  const result = await prisma.measurement.deleteMany({ where: { projectId: String(req.params.projectId) } });
  return res.json({ success: true, count: result.count });
};
