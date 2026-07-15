import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  createWriteStream,
} from 'fs';
import { rmSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { File, FileDocument } from './schema/file.schema';
import { BizException } from 'src/common/exceptions/biz.exception';

@Injectable()
export class FileService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  async remove(id: string) {
    const record = await this.fileModel.findById(id).lean();
    if (!record) {
      throw new BizException('文件不存在');
    }
    const filepath = join(process.cwd(), 'public', 'file', record.fileUUIDname);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
    await this.fileModel.deleteOne({ _id: id });
    return null;
  }

  async findAll(page: number, size: number) {
    const skip = (page - 1) * size;
    const [fileList, totalData] = await Promise.all([
      this.fileModel.find().skip(skip).limit(size).lean().exec(),
      this.fileModel.countDocuments(),
    ]);
    return { data: fileList, totalData };
  }

  // ============= 小文件上传（diskStorage，文件已在磁盘） =============
  async saveSmallFiles(files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const fileOriginalname = Buffer.from(
            file.originalname,
            'latin1',
          ).toString('utf8');

          const record = await this.fileModel.create({
            fileTureName: fileOriginalname,
            fileUUIDname: file.filename,
            date: dayjs().format('YYYY/MM/DD'),
          });

          return {
            success: true,
            id: record._id,
            fileTureName: record.fileTureName,
            fileUUIDname: record.fileUUIDname,
            date: record.date,
            url: `/static/file/${file.filename}`,
          };
        } catch (e) {
          return {
            success: false,
            fileTureName: file.originalname,
            msg: `保存失败: ${(e as Error).message}`,
          };
        }
      }),
    );
    return results;
  }

  // ============= 大文件分片上传 =============

  async initChunkUpload(
    fileName: string,
    totalChunks: number,
    fileHash: string,
    fileSize: number,
  ) {
    const chunkDir = join(process.cwd(), 'public', 'chunks', fileHash);

    if (existsSync(chunkDir)) {
      // 续传情况：扫描已有分片
      const meta = JSON.parse(
        readFileSync(join(chunkDir, 'meta.json'), 'utf-8'),
      );
      const uploadedChunks: number[] = [];
      const files = readdirSync(chunkDir);
      for (const f of files) {
        if (f !== 'meta.json') {
          const index = Number(f);
          if (!isNaN(index)) {
            uploadedChunks.push(index);
          }
        }
      }
      return { uploadId: fileHash, uploadedChunks };
    }

    // 新上传
    mkdirSync(chunkDir, { recursive: true });
    writeFileSync(
      join(chunkDir, 'meta.json'),
      JSON.stringify({ fileName, totalChunks, fileHash, fileSize }),
    );
    return { uploadId: fileHash, uploadedChunks: [] };
  }

  async getChunkStatus(fileHash: string) {
    const chunkDir = join(process.cwd(), 'public', 'chunks', fileHash);
    if (!existsSync(chunkDir)) {
      return { exists: false, uploading: false, completedChunks: [], totalChunks: 0, fileName: '' };
    }

    const metaPath = join(chunkDir, 'meta.json');
    if (!existsSync(metaPath)) {
      return { exists: false, uploading: false, completedChunks: [], totalChunks: 0, fileName: '' };
    }

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const completedChunks: number[] = [];
    const files = readdirSync(chunkDir);
    for (const f of files) {
      if (f !== 'meta.json') {
        const index = Number(f);
        if (!isNaN(index)) {
          completedChunks.push(index);
        }
      }
    }

    return {
      exists: true,
      uploading: completedChunks.length > 0,
      completedChunks,
      totalChunks: meta.totalChunks,
      fileName: meta.fileName,
    };
  }

  async saveChunk(fileHash: string, chunkIndex: number, file: Express.Multer.File) {
    const chunkDir = join(process.cwd(), 'public', 'chunks', fileHash);
    if (!existsSync(chunkDir)) {
      throw new BizException('分片上传未初始化');
    }
    const chunkPath = join(chunkDir, `${chunkIndex}`);
    writeFileSync(chunkPath, file.buffer);
    return { chunkIndex, success: true };
  }

  async mergeChunks(fileHash: string) {
    const chunkDir = join(process.cwd(), 'public', 'chunks', fileHash);
    const metaPath = join(chunkDir, 'meta.json');
    if (!existsSync(metaPath)) {
      throw new BizException('分片上传未初始化');
    }

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const { fileName, totalChunks, fileSize } = meta;

    // 检查分片是否齐全
    for (let i = 0; i < totalChunks; i++) {
      if (!existsSync(join(chunkDir, `${i}`))) {
        throw new BizException(`缺少第 ${i + 1} 个分片`);
      }
    }

    // 合并写入最终文件
    const fileDir = join(process.cwd(), 'public', 'file');
    if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

    const finalUUID = uuid();
    const finalName = `${finalUUID}${extname(fileName)}`;
    const finalPath = join(fileDir, finalName);
    const writeStream = createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = readFileSync(join(chunkDir, `${i}`));
      writeStream.write(chunkData);
    }
    writeStream.end();

    // 清理临时分片目录
    rmSync(chunkDir, { recursive: true, force: true });

    // 写入数据库
    const record = await this.fileModel.create({
      fileTureName: fileName,
      fileUUIDname: finalName,
      date: dayjs().format('YYYY/MM/DD'),
      fileSize: fileSize ?? 0,
      fileHash: fileHash,
    });

    return {
      id: record._id,
      fileTureName: record.fileTureName,
      fileUUIDname: record.fileUUIDname,
      date: record.date,
      url: `/static/file/${finalName}`,
    };
  }

  async cancelChunks(fileHash: string) {
    const chunkDir = join(process.cwd(), 'public', 'chunks', fileHash);
    if (existsSync(chunkDir)) {
      rmSync(chunkDir, { recursive: true, force: true });
    }
    return { success: true };
  }

  // 通过 uuid 文件名查询单个文件
  async findByUUID(fileUUID: string) {
    const record = await this.fileModel
      .findOne({ fileUUIDname: { $regex: `^${fileUUID}` } })
      .lean();
    if (!record) return null;
    return {
      id: record._id,
      fileTureName: record.fileTureName,
      fileUUIDname: record.fileUUIDname,
      date: record.date,
      url: `/static/file/${record.fileUUIDname}`,
    };
  }
}
