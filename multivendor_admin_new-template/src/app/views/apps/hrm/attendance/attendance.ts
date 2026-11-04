import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { AttendanceTable } from './components/attendance-table/attendance-table'
import { AttendanceWidget } from './components/attendance-widget/attendance-widget'
import { attendanceStatData } from './data'

@Component({
  selector: 'app-attendance',
  imports: [PageBreadcrumb, AttendanceWidget, AttendanceTable],
  templateUrl: './attendance.html',
  styles: ``,
})
export class Attendance {
  attendanceStatData = attendanceStatData
}
