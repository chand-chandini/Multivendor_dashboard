import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { AsyncPipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { topCityWeatherData, TopCityWeatherType } from '../../data'

@Component({
  selector: 'app-top-cities-weather',
  imports: [RouterLink, CustomPagination, AsyncPipe, NgbSortableHeader, FormsModule, Icon],
  providers: [TableService],
  templateUrl: './top-cities-weather.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopCitiesWeather {
  topCityWeatherData = topCityWeatherData

  topCityWeatherData$: Observable<TopCityWeatherType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<TopCityWeatherType>) {
    this.topCityWeatherData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(topCityWeatherData), 5)
  }
}
