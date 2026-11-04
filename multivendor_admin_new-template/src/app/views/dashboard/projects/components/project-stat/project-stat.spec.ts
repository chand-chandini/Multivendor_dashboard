import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProjectStat } from './project-stat'

describe('ProjectStat', () => {
  let component: ProjectStat
  let fixture: ComponentFixture<ProjectStat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectStat],
    }).compileComponents()

    fixture = TestBed.createComponent(ProjectStat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
