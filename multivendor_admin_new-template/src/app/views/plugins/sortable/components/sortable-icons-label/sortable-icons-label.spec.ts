import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SortableIconsLabel } from './sortable-icons-label'

describe('SortableIconsLabel', () => {
  let component: SortableIconsLabel
  let fixture: ComponentFixture<SortableIconsLabel>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortableIconsLabel],
    }).compileComponents()

    fixture = TestBed.createComponent(SortableIconsLabel)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
