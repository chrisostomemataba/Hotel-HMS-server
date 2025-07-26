// src/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const defaultRoles = [
    {
      name: 'Admin',
      description: 'System Administrator with full access',
      permissions: [
        { moduleName: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'roles', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'reservations', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'pos', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'finance', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'staff', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ],
    },
    {
      name: 'Receptionist',
      description: 'Front desk operations and guest management',
      permissions: [
        { moduleName: 'reservations', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
    {
      name: 'Restaurant Staff',
      description: 'Restaurant and bar operations',
      permissions: [
        { moduleName: 'pos', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleName: 'inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
    {
      name: 'Finance Officer',
      description: 'Financial operations and reporting',
      permissions: [
        { moduleName: 'finance', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleName: 'reservations', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleName: 'pos', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
    {
      name: 'Store Manager',
      description: 'Inventory and supply management',
      permissions: [
        { moduleName: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
  ];

  for (const roleData of defaultRoles) {
    let role = await prisma.role.findFirst({
      where: { name: roleData.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
        },
      });

      for (const permission of roleData.permissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            ...permission,
          },
        });
      }

      console.log(`Created role: ${role.name}`);
    }
  }

  const adminRole = await prisma.role.findFirst({
    where: { name: 'Admin' },
  });

  if (adminRole) {
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@hotel.com' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      
      await prisma.user.create({
        data: {
          fullName: 'System Administrator',
          email: 'admin@hotel.com',
          passwordHash: hashedPassword,
          roleId: adminRole.id,
          isActive: true,
        },
      });

      console.log('Admin user created:');
      console.log('Email: admin@hotel.com');
      console.log('Password: admin123456');
    } else {
      console.log('Admin user already exists');
    }
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    return;
  });