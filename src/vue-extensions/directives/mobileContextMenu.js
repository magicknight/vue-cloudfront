import Vue  from 'vue';
import {on} from '../../js/utils';

/**
 * Detects long touch taps
 */
Vue.directive('mobileContextMenu', {
    inserted(el, {value}) {

        // Validate
        if (!(typeof value === 'function')) {
            return;
        }

        let interval = null;
        on(el, 'touchstart', e => interval = setInterval(() => value(e), 500));
        on(el, 'touchend', () => interval && clearInterval(interval));
    }
});