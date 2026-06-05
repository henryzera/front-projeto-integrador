import { z } from 'zod';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[a-z]/, 'A senha precisa ter uma letra minuscula.')
  .regex(/[A-Z]/, 'A senha precisa ter uma letra maiuscula.')
  .regex(/\d/, 'A senha precisa ter um numero.');

export const loginFormSchema = z.object({
  identifier: z.string().trim().min(3, 'Informe email ou CNPJ.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

export const registerFormSchema = z
  .object({
    cnae: z
      .string()
      .transform(onlyDigits)
      .refine((value) => value.length === 7, 'O CNAE deve ter 7 digitos.'),
    cnpj: z
      .string()
      .transform(onlyDigits)
      .refine((value) => value.length === 14, 'O CNPJ deve ter 14 digitos.'),
    confirmPassword: z.string(),
    email: z.string().trim().email('Informe um email valido.').toLowerCase(),
    firstName: z.string().trim().min(2, 'Informe seu nome.'),
    lastName: z.string().trim().min(2, 'Informe seu sobrenome.'),
    password: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao conferem.',
    path: ['confirmPassword'],
  });

export const forgotPasswordRequestSchema = z.object({
  identifier: z.string().trim().min(3, 'Informe seu email ou CNPJ.'),
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().trim().min(1, 'Informe o código de recuperação.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas nao conferem.',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ForgotPasswordRequestData = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
