import { VideoGenerator } from '../video-generator';
import { performance } from 'perf_hooks';
import os from 'os';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

describe('動画生成パフォーマンステスト', () => {
  let generator: VideoGenerator;
  const initialMemoryUsage = process.memoryUsage();

  beforeAll(() => {
    generator = new VideoGenerator(3); // 最大3つの並行ジョブ
  });

  // メモリリーク検出用の関数
  const checkMemoryLeak = () => {
    const currentMemoryUsage = process.memoryUsage();
    const heapDiff = (currentMemoryUsage.heapUsed - initialMemoryUsage.heapUsed) / 1024 / 1024;
    return heapDiff;
  };

  // CPU使用率を取得する関数
  const getCPUUsage = () => {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total);
    }, 0);
    return (totalCPU / cpus.length) * 100;
  };

  // 実行時間を計測する関数
  const measureExecutionTime = async (fn: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  };

  test('単一ジョブの実行時間とリソース使用量', async () => {
    const jobId = 'perf-test-single';
    let maxMemoryUsage = 0;
    let maxCPUUsage = 0;

    const executionTime = await measureExecutionTime(async () => {
      await generator.generate(jobId, (_, data) => {
        const memoryUsage = checkMemoryLeak();
        const cpuUsage = getCPUUsage();
        maxMemoryUsage = Math.max(maxMemoryUsage, memoryUsage);
        maxCPUUsage = Math.max(maxCPUUsage, cpuUsage);
        logger.info(`Progress: ${data.progress}%, Memory: ${memoryUsage.toFixed(2)}MB, CPU: ${cpuUsage.toFixed(2)}%`);
      });
    });

    expect(executionTime).toBeLessThan(30000); // 30秒以内
    expect(maxMemoryUsage).toBeLessThan(500); // 500MB以内
    expect(maxCPUUsage).toBeLessThan(80); // CPU使用率80%以内

    logger.info(`実行時間: ${(executionTime / 1000).toFixed(2)}秒`);
    logger.info(`最大メモリ使用量: ${maxMemoryUsage.toFixed(2)}MB`);
    logger.info(`最大CPU使用率: ${maxCPUUsage.toFixed(2)}%`);
  }, 35000);

  test('並行ジョブの実行時間とリソース使用量', async () => {
    const jobIds = ['perf-test-1', 'perf-test-2', 'perf-test-3'];
    let maxMemoryUsage = 0;
    let maxCPUUsage = 0;
    const progressMap = new Map<string, number>();

    const executionTime = await measureExecutionTime(async () => {
      await Promise.all(jobIds.map(jobId => 
        generator.generate(jobId, (id, data) => {
          progressMap.set(id, data.progress);
          const memoryUsage = checkMemoryLeak();
          const cpuUsage = getCPUUsage();
          maxMemoryUsage = Math.max(maxMemoryUsage, memoryUsage);
          maxCPUUsage = Math.max(maxCPUUsage, cpuUsage);
          
          const avgProgress = Array.from(progressMap.values()).reduce((a, b) => a + b, 0) / progressMap.size;
          logger.info(`Overall Progress: ${avgProgress.toFixed(2)}%, Memory: ${memoryUsage.toFixed(2)}MB, CPU: ${cpuUsage.toFixed(2)}%`);
        })
      ));
    });

    const expectedMaxTime = 30000 * 1.5; // 単一ジョブの1.5倍まで許容
    expect(executionTime).toBeLessThan(expectedMaxTime);
    expect(maxMemoryUsage).toBeLessThan(1000); // 1GB以内
    expect(maxCPUUsage).toBeLessThan(90); // CPU使用率90%以内

    logger.info(`並行実行時間: ${(executionTime / 1000).toFixed(2)}秒`);
    logger.info(`並行最大メモリ使用量: ${maxMemoryUsage.toFixed(2)}MB`);
    logger.info(`並行最大CPU使用率: ${maxCPUUsage.toFixed(2)}%`);
  }, 50000);

  test('エラー発生時のリソース解放', async () => {
    const jobId = 'perf-test-error';
    const initialMemory = process.memoryUsage().heapUsed;

    try {
      await generator.generate(jobId, () => {
        throw new Error('Simulated error');
      });
    } catch (error) {
      // エラーは期待通り
    }

    // クリーンアップ後のメモリ使用量を確認
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024;

    expect(memoryDiff).toBeLessThan(10); // メモリリークが10MB未満
    expect(generator['activeJobs'].size).toBe(0); // アクティブジョブが正しくクリーンアップされている

    logger.info(`エラー後のメモリ差分: ${memoryDiff.toFixed(2)}MB`);
  });

  test('キャンセル時のリソース解放', async () => {
    const jobId = 'perf-test-cancel';
    const initialMemory = process.memoryUsage().heapUsed;

    const generatePromise = generator.generate(jobId, () => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    await generator.cancelGeneration(jobId);

    try {
      await generatePromise;
    } catch (error) {
      // キャンセルエラーは期待通り
    }

    // クリーンアップ後のメモリ使用量を確認
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024;

    expect(memoryDiff).toBeLessThan(10); // メモリリークが10MB未満
    expect(generator['activeJobs'].size).toBe(0); // アクティブジョブが正しくクリーンアップされている

    logger.info(`キャンセル後のメモリ差分: ${memoryDiff.toFixed(2)}MB`);
  });
}); 