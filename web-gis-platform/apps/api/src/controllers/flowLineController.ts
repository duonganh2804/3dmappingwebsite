import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
  })
});

type FlowLineCoordinates = {
  startLon: number;
  startLat: number;
  startHeight: number | null;
  endLon: number;
  endLat: number;
  endHeight: number | null;
};

const isLongitude = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;

const isLatitude = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;

const isOptionalHeight = (value: unknown): value is number | null | undefined =>
  value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value));

const hasDistinctEndpoints = (coordinates: FlowLineCoordinates) =>
  coordinates.startLon !== coordinates.endLon ||
  coordinates.startLat !== coordinates.endLat ||
  (coordinates.startHeight ?? 0) !== (coordinates.endHeight ?? 0);

const validCoordinates = (coordinates: FlowLineCoordinates) =>
  isLongitude(coordinates.startLon) &&
  isLatitude(coordinates.startLat) &&
  isOptionalHeight(coordinates.startHeight) &&
  isLongitude(coordinates.endLon) &&
  isLatitude(coordinates.endLat) &&
  isOptionalHeight(coordinates.endHeight) &&
  hasDistinctEndpoints(coordinates);

const optionalLabel = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const label = String(value).trim();
  return label || null;
};

export const listFlowLines = async (req: AuthRequest, res: Response) => {
  try {
    const flowLines = await prisma.flowLine.findMany({
      where: { projectId: String(req.params.projectId) },
      orderBy: { id: 'asc' }
    });
    return res.json(flowLines);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createFlowLine = async (req: AuthRequest, res: Response) => {
  try {
    const {
      label,
      startLon,
      startLat,
      startHeight = null,
      endLon,
      endLat,
      endHeight = null
    } = req.body ?? {};
    const coordinates: FlowLineCoordinates = {
      startLon,
      startLat,
      startHeight,
      endLon,
      endLat,
      endHeight
    };
    if (!validCoordinates(coordinates)) {
      return res.status(400).json({ error: 'Invalid flow line payload' });
    }

    const flowLine = await prisma.flowLine.create({
      data: {
        projectId: String(req.params.projectId),
        label: optionalLabel(label),
        ...coordinates
      }
    });
    return res.status(201).json(flowLine);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateFlowLine = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const id = String(req.params.flowLineId);
    const existing = await prisma.flowLine.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Flow line not found' });

    const coordinates: FlowLineCoordinates = {
      startLon: req.body?.startLon === undefined ? existing.startLon : req.body.startLon,
      startLat: req.body?.startLat === undefined ? existing.startLat : req.body.startLat,
      startHeight: req.body?.startHeight === undefined ? existing.startHeight : req.body.startHeight,
      endLon: req.body?.endLon === undefined ? existing.endLon : req.body.endLon,
      endLat: req.body?.endLat === undefined ? existing.endLat : req.body.endLat,
      endHeight: req.body?.endHeight === undefined ? existing.endHeight : req.body.endHeight
    };
    if (!validCoordinates(coordinates)) {
      return res.status(400).json({ error: 'Invalid flow line payload' });
    }

    const flowLine = await prisma.flowLine.update({
      where: { id },
      data: {
        ...(req.body?.label !== undefined ? { label: optionalLabel(req.body.label) } : {}),
        ...(req.body?.startLon !== undefined ? { startLon: coordinates.startLon } : {}),
        ...(req.body?.startLat !== undefined ? { startLat: coordinates.startLat } : {}),
        ...(req.body?.startHeight !== undefined ? { startHeight: coordinates.startHeight } : {}),
        ...(req.body?.endLon !== undefined ? { endLon: coordinates.endLon } : {}),
        ...(req.body?.endLat !== undefined ? { endLat: coordinates.endLat } : {}),
        ...(req.body?.endHeight !== undefined ? { endHeight: coordinates.endHeight } : {})
      }
    });
    return res.json(flowLine);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteFlowLine = async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.flowLine.deleteMany({
      where: {
        id: String(req.params.flowLineId),
        projectId: String(req.params.projectId)
      }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Flow line not found' });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
