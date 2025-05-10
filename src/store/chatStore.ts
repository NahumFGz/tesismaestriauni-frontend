import { create } from 'zustand'

const getInitialValues = () => ({
  chatList: [],
  refetchChats: false,
  chatActiveMessages: [],
  activeChatUuid: null
})

export const useChatStore = create((set) => ({
  ...getInitialValues(),

  onRefetchChats: () => {
    set((state) => ({ refetchChats: !state.refetchChats }))
  },

  cleanActiveChat: () => {
    set({
      chatActiveMessages: [],
      activeChatUuid: null
    })
  },

  setChatList: (chatList) => {
    set({ chatList })
  },

  setChatActiveMessages: (messages) => {
    set({ chatActiveMessages: messages })
  },

  setActiveChatUudi: (uuid) => {
    set({ activeChatUuid: uuid })
  },

  insertMessage: (message) => {
    set((state) => ({
      chatActiveMessages: [...state.chatActiveMessages, message]
    }))
  }
}))

export function useChatStoreDispatch() {
  const chatList = useChatStore((store) => store.chatList)
  const refetchChats = useChatStore((store) => store.refetchChats)
  const chatActiveMessages = useChatStore((store) => store.chatActiveMessages)
  const activeChatUuid = useChatStore((store) => store.activeChatUuid)
  const onRefetchChats = useChatStore((store) => store.onRefetchChats)
  const cleanActiveChat = useChatStore((store) => store.cleanActiveChat)
  const setChatList = useChatStore((store) => store.setChatList)
  const setChatActiveMessages = useChatStore((store) => store.setChatActiveMessages)
  const setActiveChatUudi = useChatStore((store) => store.setActiveChatUudi)
  const insertMessage = useChatStore((store) => store.insertMessage)

  return {
    chatList,
    refetchChats,
    chatActiveMessages,
    activeChatUuid,
    onRefetchChats,
    cleanActiveChat,
    setChatList,
    setChatActiveMessages,
    setActiveChatUudi,
    insertMessage
  }
}
