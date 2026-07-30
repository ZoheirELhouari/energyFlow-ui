import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SegmentationService } from '../../services/segmentation.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  protected readonly lastUpdated = signal(new Date());
  segmentationService = inject(SegmentationService);

  protected refresh(): void {
    this.lastUpdated.set(new Date());
    this.segmentationService.runSegmentationJob().subscribe({
      next: () => {
        // No need to do anything here since the dashboard subscribes to the
        // default job and will update automatically when the new job is ready.
      },
      error: (err) => {
        console.error('Failed to run segmentation job:', err);
        alert('Failed to refresh data. Please try again later.');
      },
    });
  }
}
