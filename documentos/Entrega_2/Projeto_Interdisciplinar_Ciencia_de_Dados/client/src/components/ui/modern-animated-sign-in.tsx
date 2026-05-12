import {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  forwardRef,
} from 'react';

import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = 'hsl(var(--primary))';

const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              ${BLUE},
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

Input.displayName = 'Input';

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as 'relative',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 45 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.15 }}
      >
        {children}
      </motion.div>

      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? BLUE,
          borderRadius: 4,
        }}
      />
    </section>
  );
});

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.22,
  numCircles = 10,
  className = '',
}: RippleProps) {
  return (
    <section
      className={cn(
        'absolute inset-0 flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,black,transparent)]',
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(mainCircleOpacity - i * 0.025, 0.02);

        return (
          <motion.span
            key={i}
            className="absolute rounded-full border border-primary/30 bg-primary/10"
            initial={{ scale: 0.85, opacity }}
            animate={{
              scale: [0.85, 1.08, 0.85],
              opacity: [opacity, opacity * 0.45, opacity],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
          />
        );
      })}
    </section>
  );
});

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 50,
}: OrbitingCirclesProps) {
  return (
    <motion.section
      className="absolute left-1/2 top-1/2 flex items-center justify-center"
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    >
      <motion.div
        className={cn(
          'absolute left-1/2 top-0 flex items-center justify-center rounded-full border border-primary/20 bg-background/80 p-2 shadow-lg shadow-primary/10 backdrop-blur-md',
          className
        )}
        style={{
          x: '-50%',
          y: '-50%',
        }}
        animate={{ rotate: reverse ? 360 : -360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          delay,
        }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
});

type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
  text?: string;
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = 'Cannoli',
}: TechnologyOrbitDisplayProps) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-primary via-primary/70 to-primary/10 bg-clip-text text-center text-7xl font-black leading-none text-transparent xl:text-8xl">
        {text}
      </span>

      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

type FieldType = 'text' | 'email' | 'password';

type Field = {
  label: string;
  name: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  loading?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type Errors = Record<string, string>;

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  loading = false,
  onSubmit,
  goTo,
}: AnimatedFormProps) {
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const validateForm = (event: FormEvent<HTMLFormElement>) => {
    const currentErrors: Errors = {};
    const form = event.currentTarget;

    fields.forEach((field) => {
      const input = form.elements.namedItem(field.name) as HTMLInputElement;
      const value = input?.value?.trim();

      if (field.required && !value) {
        currentErrors[field.name] = `${field.label} é obrigatório`;
      }

      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.name] = 'Digite um e-mail válido';
      }

      if (field.type === 'password' && value && value.length < 6) {
        currentErrors[field.name] =
          'A senha precisa ter pelo menos 6 caracteres';
      }
    });

    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      setErrors({});
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <BoxReveal boxColor={BLUE} duration={0.3}>
        <h2 className="text-3xl font-bold text-foreground">{header}</h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal boxColor={BLUE} duration={0.3} className="pb-2">
          <p className="max-w-sm text-sm text-muted-foreground">{subHeader}</p>
        </BoxReveal>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <section key={field.name} className="flex flex-col gap-2">
            <BoxReveal boxColor={BLUE} duration={0.3}>
              <Label htmlFor={field.name}>
                {field.label}{' '}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
            </BoxReveal>

            <BoxReveal width="100%" boxColor={BLUE} duration={0.3}>
              <section className="relative">
                <Input
                  name={field.name}
                  type={
                    field.type === 'password'
                      ? visiblePassword
                        ? 'text'
                        : 'password'
                      : field.type
                  }
                  id={field.name}
                  placeholder={field.placeholder}
                  onChange={field.onChange}
                />

                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setVisiblePassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {visiblePassword ? (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </section>

              {errors[field.name] && (
                <p className="mt-1 text-xs text-destructive">
                  {errors[field.name]}
                </p>
              )}
            </BoxReveal>
          </section>
        ))}

        {errorField && (
          <p className="text-sm font-medium text-destructive">{errorField}</p>
        )}

        <BoxReveal width="100%" boxColor={BLUE} duration={0.3}>
          <button
            className="group/btn relative h-11 w-full rounded-md bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processando...' : `${submitButton} →`}
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor={BLUE} duration={0.3}>
            <section className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-primary transition hover:text-primary/80"
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

const BottomGradient = () => {
  return (
    <>
      <span className="absolute -bottom-px inset-x-0 block h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute -bottom-px inset-x-10 mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium leading-none text-foreground', className)}
      {...props}
    />
  );
});

export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  Label,
  BottomGradient,
};