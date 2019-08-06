import walletSelector from '../../components/walletSelector'
// import VueQr from 'vue-qr'
import qrcode from '@chenfengyuan/vue-qrcode'

import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'

import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'transfer',
  components: {walletSelector, qrcode, QrcodeStream, QrcodeDropZone, QrcodeCapture },

  data () {
    return {
      selectedTab: 1,
      selectedWallet: {},
      isLoading: false,
      entries: [],
      model: null,
      search: null,
      to: null,
      amount: 0,
      message: null,
      sender: {},
      show: false,
      transaction: {},
      transactionSent: false,
      showQR:false,
      showQrScanner: false,
      maxMessageLength: 128,
      amountRules: [
        v => !!v || 'Amount is required',
        v => !!v && v > 0 || 'Amount must be greater than 0',
        v => !!v && parseInt(v) < parseInt(this.wallets.find(x => x.address == this.selectedWallet.address).totalAmount) || 'Amount must be smaller than wallet value',
      ],
      toRules: [
        v => !!v || 'Wallet address is required!',
        v => (!!v && v.length >= 78 && v.length <= 78) || 'Wallet address length is not valid!',
      ],
    }
  },
  computed: {
    ...mapGetters([
      'wallets',
      'transactionSubmitted',
      'floatingActionButton'
    ]),
    fields () {
      if (!this.model) return []

      return Object.keys(this.model).map(key => {
        return {
          key,
          value: this.model[key] || 'n/a'
        }
      })
    },
    items () {
      return this.entries.map(entry => {
        const email = entry.email.length > this.descriptionLimit
          ? entry.email.slice(0, this.descriptionLimit) + '...'
          : entry.email

        return Object.assign({}, entry, { email })
      })
    },
    qrText () {
      // return { tft: '01ed90bee1d6d50b730a1aacf2890ac6fc0f7718849fba5f7c5719e3cfcc4641be09c5607b0210', amount: 0 }
      return `tft:${this.selectedWallet.address}?amount=${this.amount}&message=${this.message}&sender=me`
    },
    messageRuless() {
      if (this.message && this.message.length > maxMessageLength) {
        return `Message length cannot be more then ${maxMessageLength} characters`;
      }
    },
  },
  mounted () {
    if (!this.selectedWallet.address) this.selectedWallet = this.wallets[0]
  },
  methods: {
    ...mapActions([
      'sendCoins',
      'setFab',
      'setSubmitBtnState'
    ]),
    selectWallet (wallet) {
      this.selectedWallet = wallet
    },
    send () {
      if (this.checkForm()) {
        this.sendCoins({
          from: this.selectedWallet.address,
          to: this.to,
          message: this.message,
          amount: this.amount
        })
        this.transactionSent = true
        this.to = ''
        this.message = ''
        this.amount = 0
      }
    },
    onDecode (code) {
      code = code.replace('tft:', 'tft://')
      this.to = this.getQueryVar(code, 'HOST')
      this.amount = this.getQueryVar(code, 'amount')
      this.message = this.getQueryVar(code, 'message')
      this.sender = this.getQueryVar(code, 'sender')
      this.show = true
    },
    getQueryVar (url, varName) {
      var val
      url = new URL(url)
      if (varName === 'HOST') {
        val = url.pathname.replace('//', '')
      } else {
        val = url.searchParams.get(varName)
      }
      return val
    },
    checkForm() {
      let res = this.amount && this.sender && this.amount > 0
      if (this.message) res = res == this.message.length <= maxMessageLength 
      //if (this.selectedTab === 1) res = res == (this.to.length == 78) && this.amount && this.amount > 0
      if (this.selectedTab === 1) { 
        res = res == this.to && (this.to.length == 78) 
                    && this.amount && parseInt(this.amount) > parseInt(this.wallets.find(x => x.address == this.selectedWallet.address).totalAmount)
      }
      return res
    },
    handleFormChange() {
      this.setSubmitBtnState(!this.checkForm())
    }
  },
  watch: {
    selectedTab (val) {
      this.selectedWallet = this.wallets[0]
      this.to = ''
      this.message = ''
      this.amount = '0'
    },
    floatingActionButton (val) {
      console.log('floating action button')
      if(val) {
        console.log('selected', this.selectedTab)
        if(this.selectedTab == 0) {
          console.log("show QR")
          this.showQR = true
        } else if (this.selectedTab == 1) {
          console.log("send money")
          this.send ()
        }

        this.setFab(false)
      }
    },
    message (val) {
      this.handleFormChange()
    },
    amount (val) {
      this.handleFormChange()
    },
    to (val) {
      this.handleFormChange()
    }
  }
}
