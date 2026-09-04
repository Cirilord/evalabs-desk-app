import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/data/queryKeys';
import sqlite from '@/data/sqlite';

import { createAutomationSchema } from './schema';
import type { CreateAutomationForm, CreateAutomationScreenProps } from './types';

export function CreateAutomationScreen(props: CreateAutomationScreenProps) {
  void props;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createAutomation = useMutation({
    mutationFn: (data: CreateAutomationForm) => sqlite.automation.create({ data }),
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<CreateAutomationForm>({
    defaultValues: {
      name: '',
      description: '',
    },
    resolver: zodResolver(createAutomationSchema),
  });

  async function onSubmit(data: CreateAutomationForm) {
    try {
      await createAutomation.mutateAsync(data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      await navigate('/');
    } catch (submitError) {
      setError('root', {
        message: submitError instanceof Error ? submitError.message : String(submitError),
      });
    }
  }

  return (
    <main className="flex-1 overflow-auto p-6 sm:p-10">
      <div className="mx-auto w-full max-w-xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create automation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with a name and a short description. You can configure inputs and code later.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Merge monthly spreadsheets"
              autoComplete="off"
              autoFocus
              aria-describedby="name-error"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this automation does"
              rows={5}
              aria-describedby="description-error"
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description ? (
              <p id="description-error" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to="/">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create automation'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
