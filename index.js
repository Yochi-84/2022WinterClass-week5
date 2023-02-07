const { defineRule, Form, Field, ErrorMessage, configure } = VeeValidate;
const { required, email, min } = VeeValidateRules;
const { localize, loadLocaleFromURL } = VeeValidateI18n;
const { LoadingPlugin, Component } = VueLoading;

// define global rules
defineRule('required', required);
defineRule('email', email);
defineRule('min', min);

// Load locale from URL
loadLocaleFromURL(
  'https://unpkg.com/@vee-validate/i18n@4.1.0/dist/locale/zh_TW.json'
);

configure({
  generateMessage: localize('zh_TW'),
  validateOnInput: true,
});

const apiUrl = 'https://vue3-course-api.hexschool.io/v2';
const apiPath = 'week3-backend';

let info_modal = null;
const infoModal = {
  props: ['info'],
  template: '#infoModal',
  methods: {
    show() {
      info_modal.show();
    }
  },
  watch: {
    info() {
      this.show();
    }
  },
  mounted() {
    info_modal = new bootstrap.Modal(document.getElementById('infoModal'), { keyboard: false });
  }
}

const app = Vue.createApp({
  data() {
    return {
      isWaiting: false,
      products: [],
      carts: [],
      tempInfo: {},
      orderForm: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: '',
        },
        message: ''
      },
    }
  },
  methods: {
    showMore(id) {
      axios.get(`${apiUrl}/api/${apiPath}/product/${id}`)
        .then(res => this.tempInfo = res.data.product)
        .catch(err => console.error(err))
    },
    addCart(id, qty = 1) {
      const data = {
        product_id: id,
        qty
      }
      this.isWaiting = true;
      axios.post(`${apiUrl}/api/${apiPath}/cart`, { data })
        .then(() => {
          alert('加入購物車成功!');
          this.isWaiting = false;
          this.getCart();
        })
        .catch(err => console.error(err));
    },
    deleteCart(id) {
      axios.delete(`${apiUrl}/api/${apiPath}/cart/${id}`)
        .then(() => {
          alert('刪除成功!');
          this.getCart();
        })
        .catch(err => console.error(err));
    },
    clearCart() {
      if (confirm('確認清空購物車?')) {
        axios.delete(`${apiUrl}/api/${apiPath}/carts`)
          .then(() => {
            alert('購物車已清空!');
            this.getCart();
          })
          .catch(err => console.error(err));
      }
    },
    updateCart(e, id, product_id) {
      const data = {
        product_id
      }
      this.isWaiting = true;
      // 如果數字被改到小於1，則變成1
      if (!Number(e.target.value)) {
        this.carts[this.carts.findIndex(item => item.id === id)].qty = 1;
        data.qty = 1;
      } else {
        data.qty = Number(e.target.value);
      }
      axios.put(`${apiUrl}/api/${apiPath}/cart/${id}`, { data })
        .then(() => {
          this.isWaiting = false;
          alert('更改成功!');
        })
        .catch(err => console.error(err));
    },
    getCart() {
      axios.get(`${apiUrl}/api/${apiPath}/cart`)
        .then(res => this.carts = res.data.data.carts)
        .catch(err => console.error(err));
    },
    // 大數字補上逗號
    showThousandths(number) {
      return String(number).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
    },
    onSubmit() {
      if (confirm('確認送出訂單?')) {
        axios.post(`https://vue3-course-api.hexschool.io/v2/api/week3-backend/order`, { data: this.orderForm })
          .then((res) => {
            alert('訂單已送出!!');
            const orderId = res.data.order_Id;
            console.log(orderId)
            return axios.post(`${apiUrl}/api/${apiPath}/pay/${orderId}`);
          })
          .then(() => {
            this.getCart();

            // 清空 data 內資料
            this.orderForm = {
              user: {
                name: '',
                email: '',
                tel: '',
                address: '',
              },
              message: ''
            };

            // 重置 vee-validate
            this.$refs.form.resetForm();

            alert("已結帳!!");
          })
          .catch(err => console.error(err));
      }
    },
    isPhone(value) {
      const phoneNumber = /^(09)[0-9]{8}$/;
      return phoneNumber.test(value) ? true : '需要正確的電話號碼';
    },
  },
  computed: {
    totalPrice() {
      if (this.carts.length) {
        return this.carts.reduce((acc, cur) => acc + cur.final_total, 0);
      }
    }
  },
  mounted() {
    let loader = this.$loading.show({
      // Optional parameters
      container: null,
      canCancel: false,
      color: '#e22163',
      loader: 'bars',
      'lock-scroll': true,
      blur: '2px',
      height: 65,
      width: 95
    });
    const getProducts = () => axios.get(`${apiUrl}/api/${apiPath}/products/all`);
    const getCarts = () => axios.get(`${apiUrl}/api/${apiPath}/cart`);
    axios.all([getProducts(), getCarts()])
      .then(
        axios.spread((acct, perms) => {
          setTimeout(() => {
            this.products = acct.data.products;
            this.carts = perms.data.data.carts;
            loader.hide();
          }, 2000);
        })
      )
      .catch(err => console.error(err));
  },
  components: {
    infoModal,
    VForm: Form,
    VField: Field,
    ErrorMessage,
  }
})

app.use(LoadingPlugin);
app.component('loading', Component);

app.mount('#app');