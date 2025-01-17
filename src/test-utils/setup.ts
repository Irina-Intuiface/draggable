import '@testing-library/jest-dom';

import * as matchers from './matchers';

expect.extend(matchers);

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toHaveBeenCalledWithEvent: (expectedEvent: unknown) => R;
      toHaveBeenCalledWithEventProperties: (
        expectedEvent: Record<string, unknown>
      ) => R;
      toHaveOrder: (expectedOrder: HTMLElement[]) => R;
      toHaveTriggeredSensorEvent: (
        expectedEventName: string,
        expectedCount?: number
      ) => R;
      toHaveCanceledSensorEvent: (expectedEventName: string) => R;
    }
  }
}
