import { z } from 'zod';

const UserCreateSchema = z.object({
    userId: z.string().min(1, { message: "O ID do usuário é obrigatório." }),
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    email: z.string().email({ message: "O e-mail fornecido não é válido." })
});

const UserEditSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).optional(),
    email: z.string().email({ message: "O e-mail fornecido não é válido." }).optional()
});


const UserSchema = z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string().email()
});

// Inferência dos tipos
export type UserCreateRequest = z.infer<typeof UserCreateSchema>;
export type UserEditRequest = z.infer<typeof UserEditSchema>;
export type UserResponse = z.infer<typeof UserSchema>;

export {
    UserCreateSchema,
    UserEditSchema,
    UserSchema
};
