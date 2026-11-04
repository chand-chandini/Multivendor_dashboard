import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UserGeography } from './user-geography'

describe('UserGeography', () => {
  let component: UserGeography
  let fixture: ComponentFixture<UserGeography>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserGeography],
    }).compileComponents()

    fixture = TestBed.createComponent(UserGeography)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
