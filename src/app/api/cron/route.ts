import { NextRequest, NextResponse } from 'next/server';
import { cronService } from '@/lib/services/cron.service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // 驗證請求來源
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 獲取所有定時任務狀態
    const jobs = cronService.getJobs();
    
    return NextResponse.json({
      success: true,
      jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in cron status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 驗證請求來源
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, jobName } = body;

    switch (action) {
      case 'start':
        await cronService.start();
        return NextResponse.json({ success: true, message: 'Cron service started' });
      
      case 'stop':
        await cronService.stop();
        return NextResponse.json({ success: true, message: 'Cron service stopped' });
      
      case 'restart':
        await cronService.stop();
        await cronService.start();
        return NextResponse.json({ success: true, message: 'Cron service restarted' });
      
      case 'trigger':
        if (!jobName) {
          return NextResponse.json(
            { error: 'jobName is required' },
            { status: 400 }
          );
        }
        
        // 這裡可以觸發特定任務
        logger.info(`Manual trigger requested for job: ${jobName}`);
        return NextResponse.json({ success: true, message: `Job ${jobName} triggered` });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in cron API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}