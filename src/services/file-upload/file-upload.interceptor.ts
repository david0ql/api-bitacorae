import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Type, mixin } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ModuleRef, ContextIdFactory } from '@nestjs/core'
import { FileUploadService } from './file-upload.service'

export function FileUploadInterceptor(fieldName = 'file', folder = '', multiple = false, maxCount = 10): Type<NestInterceptor> {
	@Injectable()
	class MixinInterceptor implements NestInterceptor {
		constructor(private readonly moduleRef: ModuleRef) {}

		async intercept(context: ExecutionContext, next: CallHandler) {
			const request = context.switchToHttp().getRequest()
			const contextId = ContextIdFactory.getByRequest(request)

			const fileUploadService = await this.moduleRef.resolve(FileUploadService, contextId)

			let multerInterceptor: any

			const storage = fileUploadService.getMulterStorage(folder)

			if (multiple) {
				multerInterceptor = FilesInterceptor(fieldName, maxCount, { storage })
			} else {
				multerInterceptor = FileInterceptor(fieldName, { storage })
			}

			const interceptorInstance = new (multerInterceptor as any)()

			return interceptorInstance.intercept(context, next)
		}
	}

	return mixin(MixinInterceptor)
}
