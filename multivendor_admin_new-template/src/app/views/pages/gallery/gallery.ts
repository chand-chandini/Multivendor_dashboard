import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { GlightboxInitDirective } from '@core/directive/glightbox.directive'
import { NgxMasonryComponent, NgxMasonryModule } from 'ngx-masonry'
const img1 = 'assets/images/gallery/1.jpg'
const img10 = 'assets/images/gallery/10.jpg'
const img11 = 'assets/images/gallery/11.jpg'
const img12 = 'assets/images/gallery/12.jpg'
const img13 = 'assets/images/gallery/13.jpg'
const img14 = 'assets/images/gallery/14.jpg'
const img2 = 'assets/images/gallery/2.jpg'
const img3 = 'assets/images/gallery/3.jpg'
const img4 = 'assets/images/gallery/4.jpg'
const img5 = 'assets/images/gallery/5.jpg'
const img6 = 'assets/images/gallery/6.jpg'
const img7 = 'assets/images/gallery/7.jpg'
const img8 = 'assets/images/gallery/8.jpg'
const img9 = 'assets/images/gallery/9.jpg'

type GalleryItem = {
  category: string
  image: string
  label: string
}

@Component({
  selector: 'app-gallery',
  imports: [PageBreadcrumb, Icon, NgxMasonryModule, GlightboxInitDirective],
  templateUrl: './gallery.html',
  styles: ``,
})
export class Gallery implements OnInit, AfterViewInit {
  @ViewChild(NgxMasonryComponent) masonry!: NgxMasonryComponent

  categoryFilter: string = ''

  images: GalleryItem[] = [
    {
      category: 'machine-learning',
      image: img1,
      label: 'Machine Learning',
    },
    {
      category: 'machine-learning',
      image: img5,
      label: 'Machine Learning',
    },
    {
      category: 'machine-learning',
      image: img6,
      label: 'Machine Learning',
    },
    {
      category: 'machine-learning',
      image: img11,
      label: 'Machine Learning',
    },

    { category: 'computer-vision', image: img2, label: 'Computer Vision' },
    { category: 'computer-vision', image: img7, label: 'Computer Vision' },
    {
      category: 'computer-vision',
      image: img12,
      label: 'Computer Vision',
    },

    { category: 'nlp', image: img3, label: 'NLP' },
    { category: 'nlp', image: img8, label: 'NLP' },
    { category: 'nlp', image: img13, label: 'NLP' },
    { category: 'nlp', image: img14, label: 'NLP' },

    { category: 'robotics', image: img4, label: 'Robotics' },
    { category: 'robotics', image: img9, label: 'Robotics' },
    { category: 'robotics', image: img10, label: 'Robotics' },
  ]

  galleryItems = this.images

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.masonry?.reloadItems()
      this.masonry?.layout()
    }, 0)
  }

  ngOnInit(): void {
    this.filterCategory('')
  }

  filterCategory(category: string): void {
    this.categoryFilter = category
    this.galleryItems = category ? this.images.filter((img) => img.category === category) : this.images
  }
}
