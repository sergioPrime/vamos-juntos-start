import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'poppins': ['Poppins', 'system-ui', 'sans-serif'],
				'mono': ['Roboto Mono', 'Consolas', 'Monaco', 'monospace'],
				'sans': ['Inter', 'system-ui', 'sans-serif'],
			},
			/* === SISTEMA DE ESPAÇAMENTO CONFORTÁVEL === */
			spacing: {
				'0.5': '0.125rem',   // 2px
				'1': '0.25rem',      // 4px
				'1.5': '0.375rem',   // 6px
				'2': '0.5rem',       // 8px
				'2.5': '0.625rem',   // 10px
				'3': '0.75rem',      // 12px
				'3.5': '0.875rem',   // 14px
				'4': '1rem',         // 16px
				'5': '1.25rem',      // 20px
				'6': '1.5rem',       // 24px
				'7': '1.75rem',      // 28px
				'8': '2rem',         // 32px
				'10': '2.5rem',      // 40px
				'12': '3rem',        // 48px
				'16': '4rem',        // 64px
				'20': '5rem',        // 80px
				'24': '6rem',        // 96px
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				/* Hierarquia de níveis visuais */
				elevated: {
					DEFAULT: 'hsl(var(--elevated))',
					foreground: 'hsl(var(--elevated-foreground))'
				},
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					active: 'hsl(var(--primary-active))'
				},
				
				/* Cores de ação com mais presença */
				action: {
					primary: 'hsl(var(--action-primary))',
					'primary-hover': 'hsl(var(--action-primary-hover))',
					'primary-active': 'hsl(var(--action-primary-active))',
					secondary: 'hsl(var(--action-secondary))',
					'secondary-hover': 'hsl(var(--action-secondary-hover))',
					destructive: 'hsl(var(--action-destructive))',
					'destructive-hover': 'hsl(var(--action-destructive-hover))'
				},
				
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			/* Gradientes para elementos destacados */
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-elevated': 'var(--gradient-elevated)'
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				md: 'var(--radius)',
				sm: 'calc(var(--radius) - 4px)',
				card: 'var(--radius-card)'
			},
			boxShadow: {
				'card': 'var(--shadow-card)',
				'elevated': 'var(--shadow-elevated)',
				'floating': 'var(--shadow-floating)',
				'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
