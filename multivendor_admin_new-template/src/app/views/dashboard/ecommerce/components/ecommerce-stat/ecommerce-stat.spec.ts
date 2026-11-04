import { ComponentFixture, TestBed } from '@angular/core/testing'
import { EcommerceStat } from './ecommerce-stat'

describe('EcommerceStat', () => {
  let component: EcommerceStat
  let fixture: ComponentFixture<EcommerceStat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceStat],
    }).compileComponents()

    fixture = TestBed.createComponent(EcommerceStat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
