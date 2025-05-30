import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Type, mixin } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express'
import { ModuleRef, ContextIdFactory } from '@nestjs/core'
import { FileUploadService } from './file-upload.service'

export function FileUploadInterceptor(
	fieldNameOrFields: string | { name: string; maxCount?: number }[],
	folder = '',
	multiple = false,
	maxCount = 10
): Type<NestInterceptor> {
	@Injectable()
	class MixinInterceptor implements NestInterceptor {
		constructor(private readonly moduleRef: ModuleRef) {}

		async intercept(context: ExecutionContext, next: CallHandler) {
			const request = context.switchToHttp().getRequest()
			const contextId = ContextIdFactory.getByRequest(request)

			const fileUploadService = await this.moduleRef.resolve(FileUploadService, contextId)

			const storage = fileUploadService.getMulterStorage(folder)

			const multerOptions = {
				storage,
				limits: {
					fileSize: 1000 * 1024 * 1024 // 1 GB
				}
			}

			let multerInterceptor: any

			if (Array.isArray(fieldNameOrFields)) {
				multerInterceptor = FileFieldsInterceptor(fieldNameOrFields, multerOptions)
			} else if (multiple) {
				multerInterceptor = FilesInterceptor(fieldNameOrFields, maxCount, multerOptions)
			} else {
				multerInterceptor = FileInterceptor(fieldNameOrFields, multerOptions)
			}

			const interceptorInstance = new multerInterceptor()

			return interceptorInstance.intercept(context, next)
		}
	}

	return mixin(MixinInterceptor)
}
