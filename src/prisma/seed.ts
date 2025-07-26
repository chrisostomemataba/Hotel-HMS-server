// src/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create admin role if it doesn't exist
  let adminRole = await prisma.role.findFirst({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'System Administrator',
      },
    });

    // Add all permissions for admin role
    const modules = ['users', 'roles', 'reservations', 'pos', 'inventory', 'finance', 'staff', 'dashboard'];
    
    for (const moduleName of modules) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          moduleName,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      });
    }
  }

  // Create admin user if it doesn't exist
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

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    return;
  });