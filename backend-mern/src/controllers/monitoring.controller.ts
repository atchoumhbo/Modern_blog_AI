import { Request, Response } from 'express';

interface MonitoringPayload {
  sessionId: string;
  userId?: string;
  errors: Array<{
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    timestamp: string;
    context?: Record<string, any>;
  }>;
  performance: Array<{
    name: string;
    value: number;
    rating?: string;
    timestamp: string;
  }>;
  timestamp: string;
}

/**
 * Receive frontend monitoring data (errors, performance metrics)
 */
export const receiveMonitoringData = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: MonitoringPayload = req.body;

    // Log errors if present
    if (payload.errors && payload.errors.length > 0) {
      console.error('📊 Frontend Errors Received:', {
        sessionId: payload.sessionId,
        userId: payload.userId,
        errorCount: payload.errors.length,
        errors: payload.errors.map(e => ({
          message: e.message,
          file: e.filename,
          line: e.lineno,
          col: e.colno,
          timestamp: e.timestamp,
        })),
      });
    }

    // Log performance metrics if present
    if (payload.performance && payload.performance.length > 0) {
      const poorMetrics = payload.performance.filter(m => m.rating === 'poor');
      if (poorMetrics.length > 0) {
        console.warn('⚠️ Poor Performance Metrics:', {
          sessionId: payload.sessionId,
          metrics: poorMetrics.map(m => ({
            name: m.name,
            value: m.value,
            rating: m.rating,
          })),
        });
      }
    }

    // TODO: Store in database for analytics
    // await prisma.monitoringEvent.createMany({ data: ... })

    res.status(200).json({
      success: true,
      message: 'Monitoring data received',
      received: {
        errors: payload.errors?.length || 0,
        metrics: payload.performance?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error receiving monitoring data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process monitoring data',
    });
  }
};

/**
 * Get monitoring statistics (admin only)
 */
export const getMonitoringStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement database queries for stats
    res.status(200).json({
      success: true,
      stats: {
        totalErrors: 0,
        totalSessions: 0,
        avgPerformance: {},
        message: 'Stats not yet implemented - data logged to console',
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring statistics',
    });
  }
};
