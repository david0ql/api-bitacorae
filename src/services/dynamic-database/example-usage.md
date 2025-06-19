# Ejemplo de uso del DynamicEntityService

## En cualquier service que necesite acceso dinámico a entidades:

```typescript
import { Injectable } from '@nestjs/common'
import { DynamicEntityService } from 'src/services/dynamic-database/dynamic-entity.service'
import { User } from 'src/entities/User'
import { Business } from 'src/entities/Business'

@Injectable()
export class ExampleService {
  constructor(
    private readonly dynamicEntityService: DynamicEntityService
  ) {}

  // Opción 1: Usar executeWithRepository (recomendado)
  async getUsersFromBusiness(businessName: string) {
    return await this.dynamicEntityService.executeWithRepository(
      businessName,
      User,
      async (userRepository) => {
        return await userRepository.find()
      }
    )
  }

  // Opción 2: Usar getRepository (para operaciones complejas)
  async createUserInBusiness(businessName: string, userData: any) {
    const userRepository = await this.dynamicEntityService.getRepository(User, businessName)
    const user = userRepository.create(userData)
    return await userRepository.save(user)
  }

  // Opción 3: Usar executeWithBusinessConnection (para operaciones con múltiples entidades)
  async getBusinessData(businessName: string) {
    return await this.dynamicEntityService.executeWithBusinessConnection(
      businessName,
      async (dataSource) => {
        const userRepository = dataSource.getRepository(User)
        const businessRepository = dataSource.getRepository(Business)
        
        const users = await userRepository.find()
        const businesses = await businessRepository.find()
        
        return { users, businesses }
      }
    )
  }
}
```

## En el módulo correspondiente:

```typescript
import { Module } from '@nestjs/common'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { ExampleService } from './example.service'

@Module({
  imports: [DynamicDatabaseModule],
  providers: [ExampleService],
  exports: [ExampleService]
})
export class ExampleModule {}
```

## Ventajas de cada enfoque:

1. **executeWithRepository**: 
   - Más simple para operaciones con una sola entidad
   - Manejo automático de conexiones
   - Menos código boilerplate

2. **getRepository**: 
   - Más control sobre la conexión
   - Útil para operaciones complejas
   - Necesitas manejar el cierre de conexión manualmente

3. **executeWithBusinessConnection**: 
   - Útil para operaciones con múltiples entidades
   - Acceso directo al DataSource
   - Manejo automático de conexiones 