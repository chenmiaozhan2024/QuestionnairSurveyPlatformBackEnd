import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/public.decorator';
import { BizException } from 'src/common/exceptions/biz.exception';
import { PageFileDto } from './dto/file.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

// 小文件上传使用 diskStorage，直接写入磁盘，减少内存占用
const smallFileStorage = diskStorage({
  destination: join(process.cwd(), 'public', 'file'),
  filename: (_req, file, cb) => {
    const unique = uuid();
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // ==================== 常规小文件上传（diskStorage，不受内存限制） ====================
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, { storage: smallFileStorage }))
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BizException('文件内容为空');
    }
    return this.fileService.saveSmallFiles(files);
  }
  // 获取所有文件
  @Get()
  async getList(@Query() query: PageFileDto) {
    const { page, size } = query;
    console.log('执行了获取文件');

    const data = await this.fileService.findAll(page, size);
    return data;
  }
  //根据id删除文件
  @Delete()
  remove(@Query('id') id: string) {
    console.log('调用了删除文件接口');
    console.log(id);
    return this.fileService.remove(id);
  }

  // ==================== 大文件分片上传 ====================

  // 1. 初始化分片上传（返回 uploadId = fileHash）
  @Post('/chunk/init')
  async initChunk(
    @Body('fileName') fileName: string,
    @Body('totalChunks') totalChunks: number,
    @Body('fileHash') fileHash: string,
    @Body('fileSize') fileSize: number,
  ) {
    if (!fileName || !totalChunks || !fileHash || !fileSize) {
      throw new BizException('缺少 fileName、totalChunks、fileHash 或 fileSize');
    }
    return this.fileService.initChunkUpload(fileName, totalChunks, fileHash, fileSize);
  }

  // 2. 查询分片状态（续传检查）— 必须放在 :fileUUID 之前，避免路由冲突
  @Get('/chunk/status')
  async getChunkStatus(@Query('fileHash') fileHash: string) {
    if (!fileHash) {
      throw new BizException('缺少 fileHash');
    }
    return this.fileService.getChunkStatus(fileHash);
  }

  // 3. 上传单个分片
  @Post('/chunk/upload')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileHash') fileHash: string,
    @Body('chunkIndex') chunkIndex: string,
  ) {
    if (!file || !fileHash || chunkIndex === undefined) {
      throw new BizException('缺少 chunk、fileHash 或 chunkIndex');
    }
    return this.fileService.saveChunk(fileHash, Number(chunkIndex), file);
  }

  // 4. 合并所有分片
  @Post('/chunk/merge')
  async mergeChunks(@Body('fileHash') fileHash: string) {
    if (!fileHash) {
      throw new BizException('缺少 fileHash');
    }
    return this.fileService.mergeChunks(fileHash);
  }

  // 5. 取消分片上传，清理临时文件
  @Delete('/chunk/cancel')
  async cancelChunks(@Query('fileHash') fileHash: string) {
    if (!fileHash) {
      throw new BizException('缺少 fileHash');
    }
    return this.fileService.cancelChunks(fileHash);
  }

  // 根据fileUUID获取文件 — 放在最后，避免拦截 /chunk/* 等具名路由
  @Get(':fileUUID')
  async getFileByUUID(@Param('fileUUID') fileUUID: string) {
    const data = await this.fileService.findByUUID(fileUUID);
    if (!data) {
      throw new BizException('文件不存在');
    }
    return data;
  }
}
