import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/public.decorator';
import { BizException } from 'src/common/exceptions/biz.exception';
import { PageFileDto } from './dto/file.dto';
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Post()
  // 上传文件
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BizException('文件内容为空');
    }
    try {
      const data = await this.fileService.save(files);
      return data;
    } catch (e) {
      //  service 抛出的写盘错误
      console.error('文件保存失败:', e);
      throw new BizException('文件保存失败:');
    }
  }
  // 根据fileUUID获取文件
  @Public()
  @Get(':fileUUID')
  async getFileByUUID(@Param('fileUUID') fileUUID: string) {
    const data = await this.fileService.findByUUID(fileUUID);
    if (!data) {
      throw new BizException('文件不存在');
    }
    return data;
  }

  // 获取所有文件
  @Public()
  @Get()
  async getList(@Query() query: PageFileDto) {
    const { page, size } = query;

    const data = await this.fileService.findAll(page, size);
    return data;
  }
  @Public()
  //根据id删除文件
  @Delete()
  remove(@Query('id') id: string) {
    console.log('调用了删除文件接口');
    console.log(id);

    return this.fileService.remove(id);
  }
}
