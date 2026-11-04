import { Injectable } from '@angular/core'
import Swal, { SweetAlertResult } from 'sweetalert2'

/**
 * Thin wrapper over SweetAlert2 (already bundled with the template) so every
 * module page reports success, failure and confirmations the same way.
 */
@Injectable({
  providedIn: 'root',
})
export class NotifyService {
  success(title: string): void {
    Swal.fire({
      icon: 'success',
      title,
      showConfirmButton: false,
      timer: 1500,
    })
  }

  error(title: string, text?: string): void {
    Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Close',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
  }

  /** Destructive confirmation - resolves true when the user confirms. */
  confirmDelete(text = 'You will not be able to revert this.'): Promise<boolean> {
    return Swal.fire({
      title: 'Are you sure?',
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger me-2',
        cancelButton: 'btn btn-light',
      },
      buttonsStyling: false,
    }).then((result: SweetAlertResult) => result.isConfirmed === true)
  }

  /** Non-destructive confirmation, e.g. before saving an update. */
  confirm(title: string, text = 'Please confirm to proceed.'): Promise<boolean> {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      customClass: {
        confirmButton: 'btn btn-primary me-2',
        cancelButton: 'btn btn-light',
      },
      buttonsStyling: false,
    }).then((result: SweetAlertResult) => result.isConfirmed === true)
  }
}
