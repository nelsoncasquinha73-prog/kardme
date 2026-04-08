import { FormQuestion } from './formBuilder'

export function validateQuestion(question: FormQuestion): string[] {
  const errors: string[] = []

  if (!question.question.trim()) {
    errors.push('Pergunta não pode estar vazia')
  }

  if (['single_choice', 'multiple_choice'].includes(question.type)) {
    if (!question.options || question.options.length < 2) {
      errors.push('Perguntas de escolha precisam de pelo menos 2 opções')
    }
  }

  return errors
}

export function validateAnswer(question: FormQuestion, answer: string | string[]): boolean {
  if (question.is_required && !answer) {
    return false
  }

  if (question.type === 'email' && answer) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(answer as string)
  }

  if (question.type === 'date' && answer) {
    return !isNaN(Date.parse(answer as string))
  }

  return true
}
