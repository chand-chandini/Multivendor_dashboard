import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'

export type FieldRule = {
  type?: 'text' | 'email' | 'phone' | 'url' | 'number' | 'integer' | 'date' | 'datetime' | 'time' | 'color' | 'image'
  required?: boolean
  when?: () => boolean
  choices?: () => readonly unknown[]
  allowEmptyChoice?: boolean
  min?: number
  max?: number | (() => number)
  minLength?: number
  pattern?: RegExp
  formatMessage?: string
  maxField?: string
  afterField?: string
  equalsField?: string
  file?: () => File | null
  saved?: () => unknown
  accept?: string
  maxBytes?: number
}
const rulesByForm = new WeakMap<FormGroup, Record<string, FieldRule>>()
const uploads = new WeakMap<AbstractControl, { file: File; error: ValidationErrors | null }>()
const empty = (value: unknown) => value == null || (typeof value === 'string' && !value.trim())
const numeric = (value: unknown) => !empty(value) && (typeof value === 'number' || typeof value === 'string') && Number.isFinite(Number(value))

function accepts(file: File, accept = 'image/*'): boolean {
  return accept.split(',').some((type) => {
    const allowed = type.trim().toLowerCase()
    return allowed.startsWith('.') ? file.name.toLowerCase().endsWith(allowed)
      : allowed.endsWith('/*') ? file.type.toLowerCase().startsWith(allowed.slice(0, -1))
      : file.type.toLowerCase() === allowed
  })
}
function fileError(file: File, accept?: string, maxBytes?: number): ValidationErrors | null {
  if (!accepts(file, accept)) return { fileType: true }
  if (file.size === 0) return { emptyFile: true }
  if (maxBytes != null && file.size > maxBytes) return { fileSize: { maxBytes } }
  return null
}
function validDate(value: string, withTime: boolean): boolean {
  const match = value.match(withTime
    ? /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/
    : /^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const [, year, month, day] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  return Number(year) > 0 && !Number.isNaN(date.getTime()) && date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) && date.getUTCDate() === Number(day)
}
function validator(form: FormGroup, rule: FieldRule): ValidatorFn {
  return (control) => {
    if (rule.when && !rule.when()) return null
    const value = control.value
    const upload = uploads.get(control)
    if (upload?.error) return upload.error
    if (rule.type === 'image') {
      const file = rule.file?.() ?? upload?.file ?? (typeof File !== 'undefined' && value instanceof File ? value : null)
      if (file) return fileError(file, rule.accept, rule.maxBytes)
      const saved = rule.saved ? rule.saved() : value
      if (typeof saved === 'string' && saved.trim()) return null
      return rule.required === false ? null : { required: true }
    }
    if (empty(value) && !rule.allowEmptyChoice) return rule.required === false ? null : { required: true }
    if (rule.choices && !rule.choices().some((option) => String(option) === String(value))) return { selection: true }
    if (rule.type === 'email' && Validators.email(control)) return { email: true }
    if (rule.type === 'phone' && !/^\d{10}$/.test(String(value))) return { phone: true }
    if (rule.type === 'url') {
      try {
        const url = new URL(String(value))
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || /\s/.test(String(value))) return { url: true }
      } catch { return { url: true } }
    }
    if (rule.type === 'number' || rule.type === 'integer') {
      if (!numeric(value)) return { number: true }
      if (rule.type === 'integer' && !Number.isInteger(Number(value))) return { integer: true }
      if (rule.min != null && Number(value) < rule.min) return { min: { min: rule.min } }
      const max = typeof rule.max === 'function' ? rule.max() : rule.max
      if (max != null && Number(value) > max) return { max: { max } }
    }
    if ((rule.type === 'date' || rule.type === 'datetime') && !validDate(String(value), rule.type === 'datetime')) return { date: true }
    if (rule.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(value))) return { time: true }
    if (rule.type === 'color' && !/^#[0-9a-f]{6}$/i.test(String(value))) return { color: true }
    if (rule.pattern && !rule.pattern.test(String(value))) return { format: rule.formatMessage ?? 'Enter a valid value.' }
    if (rule.minLength != null && String(value).length < rule.minLength) return { minlength: { requiredLength: rule.minLength } }
    if (rule.maxField && numeric(value) && numeric(form.get(rule.maxField)?.value) && Number(value) > Number(form.get(rule.maxField)?.value)) {
      return { comparison: `Must not exceed ${rule.maxField.replaceAll('_', ' ')}.` }
    }
    if (rule.afterField && !empty(form.get(rule.afterField)?.value) && String(value) < String(form.get(rule.afterField)?.value)) {
      return { comparison: `Must be on or after ${rule.afterField.replaceAll('_', ' ')}.` }
    }
    if (rule.equalsField && value !== form.get(rule.equalsField)?.value) return { comparison: 'Passwords must match.' }
    return null
  }
}
function refresh(form: FormGroup): void {
  for (const [name, rule] of Object.entries(rulesByForm.get(form) ?? {})) {
    const control = form.get(name)
    if (!control) throw new Error(`Unknown validation field: ${name}`)
    control.setValidators(validator(form, rule))
    control.updateValueAndValidity({ onlySelf: true, emitEvent: false })
  }
  form.updateValueAndValidity({ emitEvent: false })
}
export function withValidation<T extends FormGroup>(form: T, rules: Record<string, FieldRule>): T {
  rulesByForm.set(form, rules)
  refresh(form)
  // Recheck conditional rules and comparisons whenever a sibling changes.
  form.valueChanges.subscribe(() => refresh(form))
  return form
}
export function validateForm(form: FormGroup): boolean {
  refresh(form)
  form.markAllAsTouched()
  return form.valid && !form.pending
}
export function resetValidation(form: FormGroup): void {
  Object.values(form.controls).forEach((control) => uploads.delete(control))
}
export function fieldError(form: FormGroup, name: string, label: string): string {
  const control = form.get(name)
  if (!control?.touched || !control.errors || control.disabled) return ''
  const error = control.errors
  if (error['required']) return `${label} is required.`
  if (error['selection']) return `Select a valid ${label.toLowerCase()}.`
  if (error['email']) return 'Enter a valid email address.'
  if (error['phone']) return 'Enter a valid 10-digit phone number.'
  if (error['url']) return `Enter a valid HTTP or HTTPS URL for ${label.toLowerCase()}.`
  if (error['number']) return `${label} must be a finite number.`
  if (error['integer']) return `${label} must be a whole number.`
  if (error['min']) return `${label} must be at least ${error['min'].min}.`
  if (error['max']) return `${label} must not exceed ${error['max'].max}.`
  if (error['date']) return `Enter a valid ${label.toLowerCase()} date.`
  if (error['time']) return `Enter a valid ${label.toLowerCase()} time.`
  if (error['color']) return 'Enter a six-digit hex color (for example, #01003c).'
  if (error['minlength']) return `${label} must contain at least ${error['minlength'].requiredLength} characters.`
  if (error['fileType']) return `Choose a supported image type for ${label.toLowerCase()}.`
  if (error['emptyFile']) return `${label} must not be an empty file.`
  if (error['fileSize']) return `${label} exceeds the allowed size of ${error['fileSize'].maxBytes} bytes.`
  if (error['uploadPending']) return `Wait for ${label.toLowerCase()} to finish loading.`
  if (error['fileRead']) return `Could not read ${label.toLowerCase()}. Choose the file again.`
  return error['format'] ?? error['comparison'] ?? `Enter a valid ${label.toLowerCase()}.`
}
export function checkImageFile(control: AbstractControl, file: File, accept = 'image/*', maxBytes?: number): boolean {
  const error = fileError(file, accept, maxBytes)
  uploads.set(control, { file, error })
  control.markAsTouched()
  control.updateValueAndValidity()
  return !error
}
export function beginImageRead(control: AbstractControl, file: File, accept = 'image/*'): boolean {
  if (!checkImageFile(control, file, accept)) return false
  uploads.set(control, { file, error: { uploadPending: true } })
  control.updateValueAndValidity()
  return true
}
export function completeImageRead(control: AbstractControl, value: string, file: File): void {
  const upload = uploads.get(control)
  if (!upload || upload.file !== file) return
  upload.error = null
  control.setValue(value)
}
export function failImageRead(control: AbstractControl, file: File): void {
  const upload = uploads.get(control)
  if (!upload || upload.file !== file) return
  upload.error = { fileRead: true }
  control.updateValueAndValidity()
}
/** Preserve the saved calendar/wall-clock value in native date inputs. */
export function dateInput(value: unknown, withTime = false): string {
  return typeof value === 'string' ? value.replace(' ', 'T').slice(0, withTime ? 16 : 10) : ''
}
