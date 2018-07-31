Component({
  mixins:[{ didMount() {}, }],
  data: {time:3,isShow:true},
  props:{x:1},
  didUpdate(prevProps,prevData){},
  didUnmount(){},
  methods:{
    onMyClick(ev){
      my.alert({});
      this.props.onXX({ ...ev, e2:1});
    },
    close(){
      this.setData({
         isShow:false
      })
    }
  },
  didMount(){
    let time= setInterval(()=>{
      this.setData({
        time:this.data.time-1
      })
      if(this.data.time==0){
        clearInterval(time)
        setTimeout(()=>{
          this.setData({
            isShow:false
          })
        },500)
      }
    },1000)
  }
})