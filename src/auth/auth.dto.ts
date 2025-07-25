import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty({example:'admin@example.com'})
    @IsEmail()
    email: string;

    @ApiProperty({example:'password123'})
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class AuthResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    user: {
        id: string;
        fullName: string;
        email: string;
        role:{
            id: string;
            name: string;
            description: string;
        };
        permissions: Array<{
            moduleName: string;
            canView: boolean;
            canCreate: boolean;
            canEdit: boolean;
            canDelete: boolean;
        }>;
    };
}

