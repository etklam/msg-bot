import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { cronService } from '@/lib/services/cron.service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active') === 'true';

    const where = isActive ? { isActive: true } : {};
    
    const cronJobs = await prisma.cronJob.findMany({
      where,
      include: {
        executionLogs: {
          take: 5,
          orderBy: { executedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: cronJobs,
      count: cronJobs.length
    });
  } catch (error) {
    logger.error('Error fetching cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt, schedule, telegramChatId } = body;

    // 驗證必填欄位
    if (!name || !prompt || !schedule || !telegramChatId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 驗證 cron 表達式格式
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    
    if (!cronRegex.test(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron schedule format' },
        { status: 400 }
      );
    }

    const cronJob = await prisma.cronJob.create({
      data: {
        name,
        prompt,
        schedule,
        telegramChatId: telegramChatId.toString(),
        isActive: true
      }
    });

    logger.info(`Created new cron job: ${name}`);
    
    return NextResponse.json({
      success: true,
      data: cronJob
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to create cron job' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, prompt, schedule, telegramChatId, isActive } = body;

    const cronJob = await prisma.cronJob.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(prompt && { prompt }),
        ...(schedule && { schedule }),
        ...(telegramChatId && { telegramChatId: telegramChatId.toString() }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    logger.info(`Updated cron job: ${id}`);
    
    return NextResponse.json({
      success: true,
      data: cronJob
    });
  } catch (error) {
    logger.error('Error updating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to update cron job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.cronJob.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`Deleted cron job: ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting cron job:', error);
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
      { status: 500 }
    );
  }
}