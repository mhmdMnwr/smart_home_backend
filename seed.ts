import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './src/users/schemas/user.schema';

async function bootstrap() {
  // 1. Create a lightweight NestJS application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);

  // 2. Get the User Mongoose Model
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  // 3. Define the user you want to inject
  const email = 'test@example.com';
  const password = 'mysecretpassword';
  const name = 'Test User';

  console.log(`Checking if user ${email} already exists...`);
  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    console.log(`User ${email} already exists! Skipping.`);
  } else {
    console.log(`Creating user ${email}...`);
    // 4. Hash the password manually
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Save the user to the database
    await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log(`✅ User ${email} successfully created!`);
  }

  // 6. Close the application gracefully
  await app.close();
}

bootstrap().catch(console.error);
