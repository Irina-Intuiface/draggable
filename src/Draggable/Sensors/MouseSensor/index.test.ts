import {
  createSandbox,
  triggerEvent,
  waitForDragDelay,
  DRAG_DELAY,
  clickMouse,
  moveMouse,
  releaseMouse,
} from '../../../test-utils/helpers';
import MouseSensor from '.';

const sampleMarkup = `
  <ul>
    <li class="draggable">
      <div class="handle">First handle</div>
      First item
    </li>
    <li class="draggable">
      <div class="handle">Second handle</div>
      Second item
    </li>
    <li class="non-draggable">
      <div class="handle">Non draggable handle</div>
      Non draggable item
    </li>
  </ul>
`;

describe('MouseSensor', () => {
  let sandbox;
  let mouseSensor;
  let draggableElement;
  let nonDraggableElement;

  function setup(optionsParam = {}) {
    const options = {
      draggable: '.draggable',
      delay: 0,
      distance: 0,
      ...optionsParam,
    };

    sandbox = createSandbox(sampleMarkup);
    const containers = sandbox.querySelectorAll('ul');
    draggableElement = sandbox.querySelector('.draggable');
    nonDraggableElement = sandbox.querySelector('.non-draggable');
    mouseSensor = new MouseSensor(containers, options);
    mouseSensor.attach();
  }

  function teardown() {
    mouseSensor.detach();
    sandbox.remove();
  }

  describe('common', () => {
    beforeEach(setup);

    afterEach(teardown);

    it('does not trigger `drag:start` event when clicking on non draggable element', () => {
      function dragFlow() {
        clickMouse(document.body);
        waitForDragDelay();
        clickMouse(nonDraggableElement);
        waitForDragDelay();
      }

      expect(dragFlow).not.toHaveTriggeredSensorEvent('drag:start');
    });

    it('prevents context menu while dragging', () => {
      let contextMenuEvent = triggerEvent(draggableElement, 'contextmenu');

      expect(contextMenuEvent.defaultPrevented).toBe(false);

      clickMouse(draggableElement);
      waitForDragDelay();
      contextMenuEvent = triggerEvent(draggableElement, 'contextmenu');

      expect(contextMenuEvent.defaultPrevented).toBe(true);

      releaseMouse(draggableElement);
    });

    it('prevents native drag when initiating drag flow', () => {
      let dragEvent = triggerEvent(draggableElement, 'dragstart');

      expect(dragEvent.defaultPrevented).toBe(false);

      clickMouse(draggableElement);
      dragEvent = triggerEvent(draggableElement, 'dragstart');

      expect(dragEvent.defaultPrevented).toBe(true);

      releaseMouse(document.body);
    });

    it('does not prevent `dragstart` event when attempting to drag outside of draggable container', () => {
      clickMouse(document.body);
      moveMouse(document, { pageX: 1, pageY: 1 });
      const nativeDragEvent = triggerEvent(draggableElement, 'dragstart');

      expect(nativeDragEvent.defaultPrevented).toBe(false);

      releaseMouse(document.body);
    });

    it('does not prevent `dragstart` event when attempting to drag non draggable element', () => {
      clickMouse(nonDraggableElement);
      moveMouse(document, { pageX: 1, pageY: 1 });
      const nativeDragEvent = triggerEvent(nonDraggableElement, 'dragstart');

      expect(nativeDragEvent.defaultPrevented).toBe(false);

      releaseMouse(document.body);
    });

    it('triggers `drag:stop` event when releasing mouse while dragging', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        releaseMouse(document.body);
      }

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:stop');
    });

    it('does not trigger `drag:start` event when right clicking or holding ctrl or meta key', () => {
      function dragFlowWithRightClick() {
        clickMouse(draggableElement, { button: 2 });
        waitForDragDelay();
        releaseMouse(document.body);
      }

      function dragFlowWithCtrlKey() {
        clickMouse(draggableElement, { ctrlKey: true });
        waitForDragDelay();
        releaseMouse(document.body);
      }

      function dragFlowWithMetaKey() {
        clickMouse(draggableElement, { metaKey: true });
        waitForDragDelay();
        releaseMouse(document.body);
      }

      [
        dragFlowWithRightClick,
        dragFlowWithCtrlKey,
        dragFlowWithMetaKey,
      ].forEach((dragFlow) => {
        expect(dragFlow).not.toHaveTriggeredSensorEvent('drag:start');
      });
    });

    it('cancels `drag:start` event when canceling sensor event', () => {
      sandbox.addEventListener('drag:start', (event) => {
        event.detail.preventDefault();
      });

      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        releaseMouse(draggableElement);
      }

      expect(dragFlow).toHaveCanceledSensorEvent('drag:start');
    });
  });

  describe('using handle', () => {
    let handleInDraggableElement;
    let handleInNonDraggableElement;

    beforeEach(() => {
      setup({ handle: '.handle' });
      handleInDraggableElement = sandbox.querySelector('.draggable .handle');
      handleInNonDraggableElement = sandbox.querySelector(
        '.non-draggable .handle'
      );
    });

    afterEach(teardown);

    it('does not prevent `dragstart` event when attempting to drag handle in non draggable element', () => {
      clickMouse(handleInNonDraggableElement);
      moveMouse(document, { pageX: 1, pageY: 1 });
      const nativeDragEvent = triggerEvent(
        handleInNonDraggableElement,
        'dragstart'
      );

      expect(nativeDragEvent.defaultPrevented).toBe(false);

      releaseMouse(document.body);
    });

    it('prevent `dragstart` event when attempting to drag handle in draggable element', () => {
      clickMouse(handleInDraggableElement);
      moveMouse(document, { pageX: 1, pageY: 1 });
      const nativeDragEvent = triggerEvent(
        handleInDraggableElement,
        'dragstart'
      );

      expect(nativeDragEvent.defaultPrevented).toBe(true);

      releaseMouse(document.body);
    });

    it('does not prevent `dragstart` event when attempting to drag outside of handle inside of draggable', () => {
      clickMouse(draggableElement);
      moveMouse(document, { pageX: 1, pageY: 1 });
      const nativeDragEvent = triggerEvent(draggableElement, 'dragstart');

      expect(nativeDragEvent.defaultPrevented).toBe(false);

      releaseMouse(document.body);
    });
  });

  describe('using distance', () => {
    beforeEach(() => {
      setup({ distance: 1 });
    });

    afterEach(teardown);

    it('triggers `drag:start` sensor event on mousemove after distance has been met', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        releaseMouse(document.body);
      }

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start');
    });

    it('does not trigger `drag:start` event releasing mouse before distance has been met', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        releaseMouse(document.body);
      }

      function hastyDragFlow() {
        clickMouse(draggableElement);
        releaseMouse(document.body);
      }

      expect(hastyDragFlow).not.toHaveTriggeredSensorEvent('drag:start');

      expect(hastyDragFlow).not.toHaveTriggeredSensorEvent('drag:stop');

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start');

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:stop');
    });

    it('triggers `drag:move` event while moving the mouse after distance has been met', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        moveMouse(document.body);
        releaseMouse(document.body);
      }

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:move');
    });
  });

  describe('using delay', () => {
    beforeEach(() => {
      setup({ delay: DRAG_DELAY });
    });

    afterEach(teardown);

    it('triggers `drag:start` sensor event after delay', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        releaseMouse(document.body);
      }

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start');
    });

    it('does not trigger `drag:start` event releasing mouse before delay', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        releaseMouse(document.body);
      }

      function hastyDragFlow() {
        clickMouse(draggableElement);
        releaseMouse(document.body);
      }

      expect(hastyDragFlow).not.toHaveTriggeredSensorEvent('drag:start');

      expect(hastyDragFlow).not.toHaveTriggeredSensorEvent('drag:stop');

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start');

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:stop');
    });

    it('triggers `drag:move` event while moving the mouse after delay', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        moveMouse(document.body);
        releaseMouse(document.body);
      }

      expect(dragFlow).toHaveTriggeredSensorEvent('drag:move');
    });
  });

  describe('delay and distance', () => {
    beforeEach(() => {
      setup({ delay: DRAG_DELAY, distance: 1 });
    });

    afterEach(teardown);

    it('does not trigger `drag:start` before delay ends', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        releaseMouse(document.body);
      }
      expect(dragFlow).not.toHaveTriggeredSensorEvent('drag:start');
    });

    it('does not trigger `drag:start` before distance is met', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        waitForDragDelay();
        releaseMouse(document.body);
      }
      expect(dragFlow).not.toHaveTriggeredSensorEvent('drag:start');
    });

    it('does not trigger `drag:start` sensor event when moved during delay', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        const dateMock = waitForDragDelay({ restoreDateMock: false });
        moveMouse(draggableElement, { pageY: 2, pageX: 0 });
        waitForDragDelay();
        releaseMouse(document.body);
        dateMock.mockRestore();
      }
      expect(dragFlow).not.toHaveTriggeredSensorEvent('drag:start', 1);
    });

    it('only triggers `drag:start` sensor event once when distance and delay are met at the same time', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        const next = Date.now() + DRAG_DELAY;
        const dateMock = jest.spyOn(Date, 'now').mockImplementation(() => {
          return next;
        });
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        jest.advanceTimersByTime(DRAG_DELAY);
        releaseMouse(document.body);
        dateMock.mockRestore();
      }
      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start', 1);
    });

    it('only triggers `drag:start` sensor event once when distance is met after delay', () => {
      function dragFlow() {
        clickMouse(draggableElement);
        const next = Date.now() + DRAG_DELAY + 1;
        const dateMock = jest.spyOn(Date, 'now').mockImplementation(() => {
          return next;
        });
        jest.advanceTimersByTime(DRAG_DELAY + 1);
        moveMouse(draggableElement, { pageY: 1, pageX: 0 });
        releaseMouse(document.body);
        dateMock.mockRestore();
      }
      expect(dragFlow).toHaveTriggeredSensorEvent('drag:start', 1);
    });
  });
});
