import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';

/**
 * Modal that previews the thesis PDF behind this prototype. Visibility is
 * driven by the `open` input; closing is surfaced through the `close` output
 * so the host owns the state.
 */
@Component({
  selector: 'app-help-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-modal.component.html',
  styleUrl: './help-modal.component.scss',
})
export class HelpModalComponent {
  readonly open = input<boolean>(false);
  readonly close = output<void>();

  /** Served from public/thesis.pdf at the app root. */
  protected readonly pdfUrl = 'thesis.pdf';

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }
}
