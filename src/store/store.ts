import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Coupon, CouponResponseSchema, Product, ShoppingCart } from './schemas'

interface Store {
  total: number
  discount: number
  contents: ShoppingCart
  coupon: Coupon
  addToCart: (product: Product) => void
  updateQuantity: (id: Product['id'], quantity: number) => void
  removeFromCart: (id: Product['id']) => void
  calculateTotal: () => void
  applyCoupon: (couponName: string) => Promise<void>
  applyDiscount: () => void
  clearOrder: () => void
}

const initialState = {
  total: 0,
  discount: 0,
  contents: [],
  coupon: {
    percentage: 0,
    name: '',
    message: ''
  }
}

export const useStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        addToCart: (product) => {
          const { id: productId, categoryId: _categoryId, ...data } = product

          //! get() se usa para acceder al estado actual del store
          const cart = get().contents

          // Buscar si el producto ya está en el carrito
          const existingItem = cart.find((item) => item.productId === productId)

          let updatedCart: ShoppingCart

          if (existingItem) {
            // Si ya alcanzó el inventario máximo, no hacemos nada
            if (existingItem.quantity >= existingItem.inventory) return

            // Incrementamos la cantidad del producto en el carrito
            updatedCart = cart.map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
            )
          } else {
            // Si no está en el carrito, lo agregamos con cantidad inicial 1
            updatedCart = [
              ...cart,
              {
                ...data,
                productId,
                quantity: 1
              }
            ]
          }

          //! set() se usa para actualizar el estado del store
          set({ contents: updatedCart })

          //* Llamar a calcular al total
          get().calculateTotal()
        },

        updateQuantity: (id, quantity) => {
          // Obtener el carrito actual
          const currentCart = get().contents

          // Generar el nuevo carrito actualizando solo el producto con el ID indicado
          const updatedCart = currentCart.map(
            (item) =>
              item.productId === id
                ? { ...item, quantity } // si coincide el ID, actualiza la cantidad
                : item // si no, deja el item igual
          )

          // Actualizar el estado
          set({ contents: updatedCart })

          //* Llamar a calcular al total
          get().calculateTotal()
        },

        removeFromCart: (id) => {
          // Obtener el carrito actual
          const currentCart = get().contents

          // Filtrar los productos, dejando fuera el que tiene el ID indicado
          const updatedCart = currentCart.filter((item) => item.productId !== id)

          // Actualizar el estado con el nuevo carrito
          set({ contents: updatedCart })

          //! Limpiar cupon cuando se borra todo
          if (!get().contents.length) {
            get().clearOrder()
          }

          //* Llamar a calcular al total
          get().calculateTotal()
        },

        calculateTotal: () => {
          const total = get().contents.reduce(
            (total, item) => total + item.quantity * item.price,
            0
          )

          set(() => ({ total }))

          //! Solo aplicar cuando el porcentaje es mayor a 0
          if (get().coupon.percentage >= 0) {
            get().applyDiscount()
          }
        },

        applyCoupon: async (couponName) => {
          const req = await fetch(`/coupons/api`, {
            method: 'POST',
            body: JSON.stringify({
              coupon_name: couponName
            })
          })
          const json = await req.json()
          const coupon = CouponResponseSchema.parse(json)
          set(() => ({ coupon }))

          //! Solo aplicar cuando el porcentake es mayor a 0
          if (get().coupon.percentage >= 0) {
            get().applyDiscount()
          }
        },

        applyDiscount: () => {
          const subtotalAmount = get().contents.reduce(
            (total, item) => total + item.quantity * item.price,
            0
          )
          const discount = (get().coupon.percentage / 100) * subtotalAmount
          const total = subtotalAmount - discount

          set(() => ({
            discount,
            total
          }))
        },

        clearOrder: () => {
          set(() => ({ ...initialState }))
        }
      }),
      {
        name: 'shopping-cart-storage', // clave del localStorage
        partialize: (state) =>
          ({
            total: state.total,
            discount: state.discount,
            contents: state.contents,
            coupon: state.coupon
          } satisfies Partial<Store>)
      }
    )
  )
)
