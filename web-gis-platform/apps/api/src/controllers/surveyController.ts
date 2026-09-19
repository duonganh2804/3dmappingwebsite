import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AuthRequest } from '../middlewares/authMiddleware';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
});
const prisma = new PrismaClient({ adapter });

const optionalString = (value: unknown) =>
  value === undefined ? undefined : value === null ? null : String(value);

const parseCapturedAt = (value: unknown) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const capturedAt = new Date(value);
  return Number.isNaN(capturedAt.getTime()) ? null : capturedAt;
};

export const listSurveys = async (req: AuthRequest, res: Response) => {
  try {
    const surveys = await prisma.survey.findMany({
      where: { projectId: String(req.params.projectId) },
      orderBy: [{ capturedAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        capturedAt: true,
        modelUrl: true,
        domUrl: true,
        pointCloudId: true
      }
    });
    return res.json(surveys.map(survey => ({
      ...survey,
      capturedAt: survey.capturedAt.toISOString()
    })));
  } catch (error: any) {
    // Some deployed databases predate the Survey table even though the Prisma
    // model and route already exist in this source tree. An empty list truthfully
    // means "no stored snapshots" and lets the Viewer use its project fallback;
    // never manufacture temporal history from the current project assets.
    if (error?.code === 'P2021') {
      console.warn('[Survey] Storage is not available; returning no snapshots.', {
        projectId: String(req.params.projectId)
      });
      return res.json([]);
    }
    return res.status(500).json({ error: error.message });
  }
};

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const capturedAt = parseCapturedAt(req.body?.capturedAt);
    if (!capturedAt) {
      return res.status(400).json({ error: 'capturedAt is required and must be a valid date' });
    }

    const survey = await prisma.survey.create({
      data: {
        projectId,
        capturedAt,
        name: optionalString(req.body?.name),
        domUrl: optionalString(req.body?.domUrl),
        metadataUrl: optionalString(req.body?.metadataUrl),
        modelUrl: optionalString(req.body?.modelUrl),
        pointCloudId: optionalString(req.body?.pointCloudId),
        calibration: optionalString(req.body?.calibration)
      }
    });
    return res.status(201).json(survey);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const id = String(req.params.surveyId);
    const existing = await prisma.survey.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Survey not found' });

    const capturedAt = req.body?.capturedAt === undefined
      ? undefined
      : parseCapturedAt(req.body.capturedAt);
    if (capturedAt === null) {
      return res.status(400).json({ error: 'capturedAt must be a valid date' });
    }

    const survey = await prisma.survey.update({
      where: { id },
      data: {
        ...(capturedAt !== undefined ? { capturedAt } : {}),
        ...(req.body?.name !== undefined ? { name: optionalString(req.body.name) } : {}),
        ...(req.body?.domUrl !== undefined ? { domUrl: optionalString(req.body.domUrl) } : {}),
        ...(req.body?.metadataUrl !== undefined ? { metadataUrl: optionalString(req.body.metadataUrl) } : {}),
        ...(req.body?.modelUrl !== undefined ? { modelUrl: optionalString(req.body.modelUrl) } : {}),
        ...(req.body?.pointCloudId !== undefined ? { pointCloudId: optionalString(req.body.pointCloudId) } : {}),
        ...(req.body?.calibration !== undefined ? { calibration: optionalString(req.body.calibration) } : {})
      }
    });
    return res.json(survey);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.survey.deleteMany({
      where: {
        id: String(req.params.surveyId),
        projectId: String(req.params.projectId)
      }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Survey not found' });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
