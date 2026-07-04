import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { File, FileDocument } from './schema/file.schema';
import { BizException } from 'src/common/exceptions/biz.exception';

@Injectable()
export class FileService {
  async remove(id: string) {
    // 1. 先查数据库，拿到文件信息
    const record = await this.fileModel.findById(id).lean();
    if (!record) {
      throw new BizException('文件不存在');
    }
    // 2. 删磁盘文件
    const filepath = join(process.cwd(), 'public', 'file', record.fileUUIDname);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
    // 3. 删数据库记录
    await this.fileModel.deleteOne({ _id: id });

    return null;
  }
  async findAll(page: number, size: number) {
    const skip = (page - 1) * size;
    const [fileList, totalData] = await Promise.all([
      this.fileModel.find().skip(skip).limit(size).lean().exec(),
      this.fileModel.countDocuments(),
    ]);
    // console.log(fileList);

    return {
      data: fileList,
      totalData,
    };
  }
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  async save(files: Express.Multer.File[]) {
    const dir = join(process.cwd(), 'public', 'file');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const results = await Promise.all(
      files.map(async (file) => {
        const unique = uuid();
        const filename = `${unique}${extname(file.originalname)}`;
        const filepath = join(dir, filename);
        const fileOriginalname = Buffer.from(
          file.originalname,
          'latin1',
        ).toString('utf8');
        try {
          // 1. 写入磁盘
          writeFileSync(filepath, file.buffer);

          // 2. 写入数据库
          const record = await this.fileModel.create({
            fileTureName: fileOriginalname,
            fileUUIDname: filename,
            date: dayjs().format('YYYY/MM/DD'),
          });

          return {
            success: true,
            id: record._id,
            fileTureName: record.fileTureName,
            fileUUIDname: record.fileUUIDname,
            date: record.date,
            url: `/static/file/${filename}`,
          };
        } catch (e) {
          return {
            success: false,
            fileTureName: file.originalname,
            msg: `保存失败: ${e.message}`,
          };
        }
      }),
    );

    return results;
  }

  // 通过 uuid 文件名查询单个文件
  async findByUUID(fileUUID: string) {
    // 传入的是 uuid，数据库里存的是 fileUUIDname = "{uuid}{ext}"
    // 所以用正则匹配以 uuid 开头的
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
