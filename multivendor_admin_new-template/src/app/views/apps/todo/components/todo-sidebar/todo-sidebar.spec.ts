import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TodoSidebar } from './todo-sidebar'

describe('TodoSidebar', () => {
  let component: TodoSidebar
  let fixture: ComponentFixture<TodoSidebar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoSidebar],
    }).compileComponents()

    fixture = TestBed.createComponent(TodoSidebar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
