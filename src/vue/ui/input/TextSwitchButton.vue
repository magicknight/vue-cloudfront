<template>
    <div class="text-switch-button">

        <span v-for="(opt, index) of options"
              ref="options"
              :class="{option: 1, active: idx === index}"
              @click="select(index)">
            {{ opt }}
        </span>

        <span ref="button" class="button"></span>

    </div>
</template>

<script>

    export default {
        props: {
            active: {
                type: Number,
                required: true
            },

            options: {
                type: Array,
                required: true
            }
        },

        data() {
            return {
                idx: this.active
            };
        },

        mounted() {
            this.select(this.active);
        },

        methods: {

            select(index) {
                const {button, options} = this.$refs;

                // Calculate offset
                let px = 0;
                for (let i = 0; i < index; i++) {
                    px += options[i].offsetWidth;
                }

                // Update button position
                button.style.width = `${options[index].offsetWidth}px`;
                button.style.left = `${px}px`;

                // Fire event
                this.$emit('change', this.options[index]);

                this.idx = index;
            }
        }
    };

</script>

<style lang="scss" scoped>

    .text-switch-button {
        position: relative;
        @include flex(row, center);
        @include font(600, 0.7em);
        background: $palette-snow-white;
        border-radius: 50em;
        height: 21px;
        cursor: pointer;
    }

    .option {
        padding: 0 0.75em;
        transition: all 0.3s;
        color: rgba($palette-grayish-blue, 0.75);
        z-index: 1;

        &.active {
            color: $palette-snow-white;

            &:hover {
                color: $palette-snow-white;
            }
        }
    }

    .button {
        position: absolute;
        transition: all 0.3s;
        border-radius: 50em;
        height: 100%;
        background: $palette-theme-primary;

        left: 0;
        top: 0;
        margin: 0;
    }

</style>
