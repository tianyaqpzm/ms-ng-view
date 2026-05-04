import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// In some environments (like running via the Angular CLI builder), 
// TestBed is initialized automatically. We use a try-catch to ensure
// it's initialized if not already, without throwing if it is.
try {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
} catch (e) {
  // Already initialized, ignore
}
