
export default function ProxyCursor (range, factory) {
    var onNextImpl = null;
    this.range = range;
    this.onNext = cursor => {
        if (onNextImpl) return onNextImpl(this);
        const impl = factory.call(this, cursor);
        if (!impl.then) return init(impl);
        impl.then(init);
    }

    const init = impl => {
        onNextImpl = impl.onNext.bind(this);
        this.direction = impl.direction || cursor.direction;
        this.continue = impl.continue || cursor.continue.bind(cursor);
        this.advance = impl.advance || function (count) {
            const _onNextImpl = onNextImpl;
            if (count > 1) onNextImpl = () => {
                if (--count === 1) onNextImpl = _onNextImpl;
                this.continue();
            }
            this.continue();
        }
        Object.defineProperties(this, {
            key: {
                get: impl.getKey || (()=>cursor.key)
            },
            value: {
                get: impl.getValue || (()=>cursor.value)
            },
            primaryKey: {
                get: impl.getPrimaryKey || (()=>cursor.primaryKey)
            }
        });
        return onNextImpl(this);
    };
}
