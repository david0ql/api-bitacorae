import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Type, mixin } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ModuleRef, ContextIdFactory } from '@nestjs/core'
import { FileUploadService } from './file-upload.service'

export function FileUploadInterceptor(fieldName = 'file', folder = ''): Type<NestInterceptor> {
	@Injectable()
	class MixinInterceptor implements NestInterceptor {
		constructor(private readonly moduleRef: ModuleRef) {}

		async intercept(context: ExecutionContext, next: CallHandler) {
			const request = context.switchToHttp().getRequest()
			const contextId = ContextIdFactory.getByRequest(request)

			const fileUploadService = await this.moduleRef.resolve(FileUploadService, contextId)

			const multerInterceptor = FileInterceptor(fieldName, {
				storage: fileUploadService.getMulterStorage(folder),
			})

			const interceptorInstance = new (multerInterceptor as any)()

			return interceptorInstance.intercept(context, next)
		}
	}

	return mixin(MixinInterceptor)
}
