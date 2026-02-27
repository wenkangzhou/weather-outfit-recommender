// 中国主要城市数据 - 简化版，按省份分组
// 数据来源：行政区划标准

export interface City {
  code: string;
  name: string;
  pinyin: string;
}

export interface Province {
  code: string;
  name: string;
  cities: City[];
}

export const CHINA_CITIES: Province[] = [
  {
    code: "110000",
    name: "北京",
    cities: [{ code: "110100", name: "北京市", pinyin: "beijing" }]
  },
  {
    code: "120000",
    name: "天津",
    cities: [{ code: "120100", name: "天津市", pinyin: "tianjin" }]
  },
  {
    code: "130000",
    name: "河北",
    cities: [
      { code: "130100", name: "石家庄", pinyin: "shijiazhuang" },
      { code: "130200", name: "唐山", pinyin: "tangshan" },
      { code: "130300", name: "秦皇岛", pinyin: "qinhuangdao" },
      { code: "130400", name: "邯郸", pinyin: "handan" },
      { code: "130500", name: "邢台", pinyin: "xingtai" },
      { code: "130600", name: "保定", pinyin: "baoding" },
      { code: "130700", name: "张家口", pinyin: "zhangjiakou" },
      { code: "130800", name: "承德", pinyin: "chengde" },
      { code: "130900", name: "沧州", pinyin: "cangzhou" },
      { code: "131000", name: "廊坊", pinyin: "langfang" },
      { code: "131100", name: "衡水", pinyin: "hengshui" }
    ]
  },
  {
    code: "140000",
    name: "山西",
    cities: [
      { code: "140100", name: "太原", pinyin: "taiyuan" },
      { code: "140200", name: "大同", pinyin: "datong" },
      { code: "140300", name: "阳泉", pinyin: "yangquan" },
      { code: "140400", name: "长治", pinyin: "changzhi" },
      { code: "140500", name: "晋城", pinyin: "jincheng" },
      { code: "140600", name: "朔州", pinyin: "shuozhou" },
      { code: "140700", name: "晋中", pinyin: "jinzhong" },
      { code: "140800", name: "运城", pinyin: "yuncheng" },
      { code: "140900", name: "忻州", pinyin: "xinzhou" },
      { code: "141000", name: "临汾", pinyin: "linfen" },
      { code: "141100", name: "吕梁", pinyin: "lvliang" }
    ]
  },
  {
    code: "150000",
    name: "内蒙古",
    cities: [
      { code: "150100", name: "呼和浩特", pinyin: "huhehaote" },
      { code: "150200", name: "包头", pinyin: "baotou" },
      { code: "150300", name: "乌海", pinyin: "wuhai" },
      { code: "150400", name: "赤峰", pinyin: "chifeng" },
      { code: "150500", name: "通辽", pinyin: "tongliao" },
      { code: "150600", name: "鄂尔多斯", pinyin: "eerduosi" },
      { code: "150700", name: "呼伦贝尔", pinyin: "hulunbeier" },
      { code: "150800", name: "巴彦淖尔", pinyin: "bayannaoer" },
      { code: "150900", name: "乌兰察布", pinyin: "wulanchabu" },
      { code: "152200", name: "兴安盟", pinyin: "xinganmeng" },
      { code: "152500", name: "锡林郭勒盟", pinyin: "xilinguolemeng" },
      { code: "152900", name: "阿拉善盟", pinyin: "alashanmeng" }
    ]
  },
  {
    code: "210000",
    name: "辽宁",
    cities: [
      { code: "210100", name: "沈阳", pinyin: "shenyang" },
      { code: "210200", name: "大连", pinyin: "dalian" },
      { code: "210300", name: "鞍山", pinyin: "anshan" },
      { code: "210400", name: "抚顺", pinyin: "fushun" },
      { code: "210500", name: "本溪", pinyin: "benxi" },
      { code: "210600", name: "丹东", pinyin: "dandong" },
      { code: "210700", name: "锦州", pinyin: "jinzhou" },
      { code: "210800", name: "营口", pinyin: "yingkou" },
      { code: "210900", name: "阜新", pinyin: "fuxin" },
      { code: "211000", name: "辽阳", pinyin: "liaoyang" },
      { code: "211100", name: "盘锦", pinyin: "panjin" },
      { code: "211200", name: "铁岭", pinyin: "tieling" },
      { code: "211300", name: "朝阳", pinyin: "chaoyang" },
      { code: "211400", name: "葫芦岛", pinyin: "huludao" }
    ]
  },
  {
    code: "220000",
    name: "吉林",
    cities: [
      { code: "220100", name: "长春", pinyin: "changchun" },
      { code: "220200", name: "吉林", pinyin: "jilin" },
      { code: "220300", name: "四平", pinyin: "siping" },
      { code: "220400", name: "辽源", pinyin: "liaoyuan" },
      { code: "220500", name: "通化", pinyin: "tonghua" },
      { code: "220600", name: "白山", pinyin: "baishan" },
      { code: "220700", name: "松原", pinyin: "songyuan" },
      { code: "220800", name: "白城", pinyin: "baicheng" },
      { code: "222400", name: "延边朝鲜族自治州", pinyin: "yanbian" }
    ]
  },
  {
    code: "230000",
    name: "黑龙江",
    cities: [
      { code: "230100", name: "哈尔滨", pinyin: "haerbin" },
      { code: "230200", name: "齐齐哈尔", pinyin: "qiqihaer" },
      { code: "230300", name: "鸡西", pinyin: "jixi" },
      { code: "230400", name: "鹤岗", pinyin: "hegang" },
      { code: "230500", name: "双鸭山", pinyin: "shuangyashan" },
      { code: "230600", name: "大庆", pinyin: "daqing" },
      { code: "230700", name: "伊春", pinyin: "yichun" },
      { code: "230800", name: "佳木斯", pinyin: "jiamusi" },
      { code: "230900", name: "七台河", pinyin: "qitaihe" },
      { code: "231000", name: "牡丹江", pinyin: "mudanjiang" },
      { code: "231100", name: "黑河", pinyin: "heihe" },
      { code: "231200", name: "绥化", pinyin: "suihua" },
      { code: "232700", name: "大兴安岭地区", pinyin: "daxinganling" }
    ]
  },
  {
    code: "310000",
    name: "上海",
    cities: [{ code: "310100", name: "上海市", pinyin: "shanghai" }]
  },
  {
    code: "320000",
    name: "江苏",
    cities: [
      { code: "320100", name: "南京", pinyin: "nanjing" },
      { code: "320200", name: "无锡", pinyin: "wuxi" },
      { code: "320300", name: "徐州", pinyin: "xuzhou" },
      { code: "320400", name: "常州", pinyin: "changzhou" },
      { code: "320500", name: "苏州", pinyin: "suzhou" },
      { code: "320600", name: "南通", pinyin: "nantong" },
      { code: "320700", name: "连云港", pinyin: "lianyungang" },
      { code: "320800", name: "淮安", pinyin: "huaian" },
      { code: "320900", name: "盐城", pinyin: "yancheng" },
      { code: "321000", name: "扬州", pinyin: "yangzhou" },
      { code: "321100", name: "镇江", pinyin: "zhenjiang" },
      { code: "321200", name: "泰州", pinyin: "taizhou" },
      { code: "321300", name: "宿迁", pinyin: "suqian" }
    ]
  },
  {
    code: "330000",
    name: "浙江",
    cities: [
      { code: "330100", name: "杭州", pinyin: "hangzhou" },
      { code: "330200", name: "宁波", pinyin: "ningbo" },
      { code: "330300", name: "温州", pinyin: "wenzhou" },
      { code: "330400", name: "嘉兴", pinyin: "jiaxing" },
      { code: "330500", name: "湖州", pinyin: "huzhou" },
      { code: "330600", name: "绍兴", pinyin: "shaoxing" },
      { code: "330700", name: "金华", pinyin: "jinhua" },
      { code: "330800", name: "衢州", pinyin: "quzhou" },
      { code: "330900", name: "舟山", pinyin: "zhoushan" },
      { code: "331000", name: "台州", pinyin: "taizhou2" },
      { code: "331100", name: "丽水", pinyin: "lishui" }
    ]
  },
  {
    code: "340000",
    name: "安徽",
    cities: [
      { code: "340100", name: "合肥", pinyin: "hefei" },
      { code: "340200", name: "芜湖", pinyin: "wuhu" },
      { code: "340300", name: "蚌埠", pinyin: "bengbu" },
      { code: "340400", name: "淮南", pinyin: "huainan" },
      { code: "340500", name: "马鞍山", pinyin: "maanshan" },
      { code: "340600", name: "淮北", pinyin: "huaibei" },
      { code: "340700", name: "铜陵", pinyin: "tongling" },
      { code: "340800", name: "安庆", pinyin: "anqing" },
      { code: "341000", name: "黄山", pinyin: "huangshan" },
      { code: "341100", name: "滁州", pinyin: "chuzhou" },
      { code: "341200", name: "阜阳", pinyin: "fuyang" },
      { code: "341300", name: "宿州", pinyin: "suzhou2" },
      { code: "341500", name: "六安", pinyin: "liuan" },
      { code: "341600", name: "亳州", pinyin: "bozhou" },
      { code: "341700", name: "池州", pinyin: "chizhou" },
      { code: "341800", name: "宣城", pinyin: "xuancheng" }
    ]
  },
  {
    code: "350000",
    name: "福建",
    cities: [
      { code: "350100", name: "福州", pinyin: "fuzhou" },
      { code: "350200", name: "厦门", pinyin: "xiamen" },
      { code: "350300", name: "莆田", pinyin: "putian" },
      { code: "350400", name: "三明", pinyin: "sanming" },
      { code: "350500", name: "泉州", pinyin: "quanzhou" },
      { code: "350600", name: "漳州", pinyin: "zhangzhou" },
      { code: "350700", name: "南平", pinyin: "nanping" },
      { code: "350800", name: "龙岩", pinyin: "longyan" },
      { code: "350900", name: "宁德", pinyin: "ningde" }
    ]
  },
  {
    code: "360000",
    name: "江西",
    cities: [
      { code: "360100", name: "南昌", pinyin: "nanchang" },
      { code: "360200", name: "景德镇", pinyin: "jingdezhen" },
      { code: "360300", name: "萍乡", pinyin: "pingxiang" },
      { code: "360400", name: "九江", pinyin: "jiujiang" },
      { code: "360500", name: "新余", pinyin: "xinyu" },
      { code: "360600", name: "鹰潭", pinyin: "yingtan" },
      { code: "360700", name: "赣州", pinyin: "ganzhou" },
      { code: "360800", name: "吉安", pinyin: "jian" },
      { code: "360900", name: "宜春", pinyin: "yichun2" },
      { code: "361000", name: "抚州", pinyin: "fuzhou2" },
      { code: "361100", name: "上饶", pinyin: "shangrao" }
    ]
  },
  {
    code: "370000",
    name: "山东",
    cities: [
      { code: "370100", name: "济南", pinyin: "jinan" },
      { code: "370200", name: "青岛", pinyin: "qingdao" },
      { code: "370300", name: "淄博", pinyin: "zibo" },
      { code: "370400", name: "枣庄", pinyin: "zaozhuang" },
      { code: "370500", name: "东营", pinyin: "dongying" },
      { code: "370600", name: "烟台", pinyin: "yantai" },
      { code: "370700", name: "潍坊", pinyin: "weifang" },
      { code: "370800", name: "济宁", pinyin: "jining" },
      { code: "370900", name: "泰安", pinyin: "taian" },
      { code: "371000", name: "威海", pinyin: "weihai" },
      { code: "371100", name: "日照", pinyin: "rizhao" },
      { code: "371300", name: "临沂", pinyin: "linyi" },
      { code: "371400", name: "德州", pinyin: "dezhou" },
      { code: "371500", name: "聊城", pinyin: "liaocheng" },
      { code: "371600", name: "滨州", pinyin: "binzhou" },
      { code: "371700", name: "菏泽", pinyin: "heze" }
    ]
  },
  {
    code: "410000",
    name: "河南",
    cities: [
      { code: "410100", name: "郑州", pinyin: "zhengzhou" },
      { code: "410200", name: "开封", pinyin: "kaifeng" },
      { code: "410300", name: "洛阳", pinyin: "luoyang" },
      { code: "410400", name: "平顶山", pinyin: "pingdingshan" },
      { code: "410500", name: "安阳", pinyin: "anyang" },
      { code: "410600", name: "鹤壁", pinyin: "hebi" },
      { code: "410700", name: "新乡", pinyin: "xinxiang" },
      { code: "410800", name: "焦作", pinyin: "jiaozuo" },
      { code: "410900", name: "濮阳", pinyin: "puyang" },
      { code: "411000", name: "许昌", pinyin: "xuchang" },
      { code: "411100", name: "漯河", pinyin: "luohe" },
      { code: "411200", name: "三门峡", pinyin: "sanmenxia" },
      { code: "411300", name: "南阳", pinyin: "nanyang" },
      { code: "411400", name: "商丘", pinyin: "shangqiu" },
      { code: "411500", name: "信阳", pinyin: "xinyang" },
      { code: "411600", name: "周口", pinyin: "zhoukou" },
      { code: "411700", name: "驻马店", pinyin: "zhumadian" }
    ]
  },
  {
    code: "420000",
    name: "湖北",
    cities: [
      { code: "420100", name: "武汉", pinyin: "wuhan" },
      { code: "420200", name: "黄石", pinyin: "huangshi" },
      { code: "420300", name: "十堰", pinyin: "shiyan" },
      { code: "420500", name: "宜昌", pinyin: "yichang" },
      { code: "420600", name: "襄阳", pinyin: "xiangyang" },
      { code: "420700", name: "鄂州", pinyin: "ezhou" },
      { code: "420800", name: "荆门", pinyin: "jingmen" },
      { code: "420900", name: "孝感", pinyin: "xiaogan" },
      { code: "421000", name: "荆州", pinyin: "jingzhou" },
      { code: "421100", name: "黄冈", pinyin: "huanggang" },
      { code: "421200", name: "咸宁", pinyin: "xianning" },
      { code: "421300", name: "随州", pinyin: "suizhou" },
      { code: "422800", name: "恩施土家族苗族自治州", pinyin: "enshi" }
    ]
  },
  {
    code: "430000",
    name: "湖南",
    cities: [
      { code: "430100", name: "长沙", pinyin: "changsha" },
      { code: "430200", name: "株洲", pinyin: "zhuzhou" },
      { code: "430300", name: "湘潭", pinyin: "xiangtan" },
      { code: "430400", name: "衡阳", pinyin: "hengyang" },
      { code: "430500", name: "邵阳", pinyin: "shaoyang" },
      { code: "430600", name: "岳阳", pinyin: "yueyang" },
      { code: "430700", name: "常德", pinyin: "changde" },
      { code: "430800", name: "张家界", pinyin: "zhangjiajie" },
      { code: "430900", name: "益阳", pinyin: "yiyang" },
      { code: "431000", name: "郴州", pinyin: "chenzhou" },
      { code: "431100", name: "永州", pinyin: "yongzhou" },
      { code: "431200", name: "怀化", pinyin: "huaihua" },
      { code: "431300", name: "娄底", pinyin: "loudi" },
      { code: "433100", name: "湘西土家族苗族自治州", pinyin: "xiangxi" }
    ]
  },
  {
    code: "440000",
    name: "广东",
    cities: [
      { code: "440100", name: "广州", pinyin: "guangzhou" },
      { code: "440200", name: "韶关", pinyin: "shaoguan" },
      { code: "440300", name: "深圳", pinyin: "shenzhen" },
      { code: "440400", name: "珠海", pinyin: "zhuhai" },
      { code: "440500", name: "汕头", pinyin: "shantou" },
      { code: "440600", name: "佛山", pinyin: "foshan" },
      { code: "440700", name: "江门", pinyin: "jiangmen" },
      { code: "440800", name: "湛江", pinyin: "zhanjiang" },
      { code: "440900", name: "茂名", pinyin: "maoming" },
      { code: "441200", name: "肇庆", pinyin: "zhaoqing" },
      { code: "441300", name: "惠州", pinyin: "huizhou" },
      { code: "441400", name: "梅州", pinyin: "meizhou" },
      { code: "441500", name: "汕尾", pinyin: "shanwei" },
      { code: "441600", name: "河源", pinyin: "heyuan" },
      { code: "441700", name: "阳江", pinyin: "yangjiang" },
      { code: "441800", name: "清远", pinyin: "qingyuan" },
      { code: "441900", name: "东莞", pinyin: "dongguan" },
      { code: "442000", name: "中山", pinyin: "zhongshan" },
      { code: "445100", name: "潮州", pinyin: "chaozhou" },
      { code: "445200", name: "揭阳", pinyin: "jieyang" },
      { code: "445300", name: "云浮", pinyin: "yunfu" }
    ]
  },
  {
    code: "450000",
    name: "广西",
    cities: [
      { code: "450100", name: "南宁", pinyin: "nanning" },
      { code: "450200", name: "柳州", pinyin: "liuzhou" },
      { code: "450300", name: "桂林", pinyin: "guilin" },
      { code: "450400", name: "梧州", pinyin: "wuzhou" },
      { code: "450500", name: "北海", pinyin: "beihai" },
      { code: "450600", name: "防城港", pinyin: "fangchenggang" },
      { code: "450700", name: "钦州", pinyin: "qinzhou" },
      { code: "450800", name: "贵港", pinyin: "guigang" },
      { code: "450900", name: "玉林", pinyin: "yulin" },
      { code: "451000", name: "百色", pinyin: "baise" },
      { code: "451100", name: "贺州", pinyin: "hezhou" },
      { code: "451200", name: "河池", pinyin: "hechi" },
      { code: "451300", name: "来宾", pinyin: "laibin" },
      { code: "451400", name: "崇左", pinyin: "chongzuo" }
    ]
  },
  {
    code: "460000",
    name: "海南",
    cities: [
      { code: "460100", name: "海口", pinyin: "haikou" },
      { code: "460200", name: "三亚", pinyin: "sanya" },
      { code: "460300", name: "三沙", pinyin: "sansha" },
      { code: "460400", name: "儋州", pinyin: "danzhou" }
    ]
  },
  {
    code: "500000",
    name: "重庆",
    cities: [{ code: "500100", name: "重庆市", pinyin: "chongqing" }]
  },
  {
    code: "510000",
    name: "四川",
    cities: [
      { code: "510100", name: "成都", pinyin: "chengdu" },
      { code: "510300", name: "自贡", pinyin: "zigong" },
      { code: "510400", name: "攀枝花", pinyin: "panzhihua" },
      { code: "510500", name: "泸州", pinyin: "luzhou" },
      { code: "510600", name: "德阳", pinyin: "deyang" },
      { code: "510700", name: "绵阳", pinyin: "mianyang" },
      { code: "510800", name: "广元", pinyin: "guangyuan" },
      { code: "510900", name: "遂宁", pinyin: "suining" },
      { code: "511000", name: "内江", pinyin: "neijiang" },
      { code: "511100", name: "乐山", pinyin: "leshan" },
      { code: "511300", name: "南充", pinyin: "nanchong" },
      { code: "511400", name: "眉山", pinyin: "meishan" },
      { code: "511500", name: "宜宾", pinyin: "yibin" },
      { code: "511600", name: "广安", pinyin: "guangan" },
      { code: "511700", name: "达州", pinyin: "dazhou" },
      { code: "511800", name: "雅安", pinyin: "yaan" },
      { code: "511900", name: "巴中", pinyin: "bazhong" },
      { code: "512000", name: "资阳", pinyin: "ziyang" },
      { code: "513200", name: "阿坝藏族羌族自治州", pinyin: "aba" },
      { code: "513300", name: "甘孜藏族自治州", pinyin: "ganzi" },
      { code: "513400", name: "凉山彝族自治州", pinyin: "liangshan" }
    ]
  },
  {
    code: "520000",
    name: "贵州",
    cities: [
      { code: "520100", name: "贵阳", pinyin: "guiyang" },
      { code: "520200", name: "六盘水", pinyin: "liupanshui" },
      { code: "520300", name: "遵义", pinyin: "zunyi" },
      { code: "520400", name: "安顺", pinyin: "anshun" },
      { code: "520500", name: "毕节", pinyin: "bijie" },
      { code: "520600", name: "铜仁", pinyin: "tongren" },
      { code: "522300", name: "黔西南布依族苗族自治州", pinyin: "qianxinan" },
      { code: "522600", name: "黔东南苗族侗族自治州", pinyin: "qiandongnan" },
      { code: "522700", name: "黔南布依族苗族自治州", pinyin: "qiannan" }
    ]
  },
  {
    code: "530000",
    name: "云南",
    cities: [
      { code: "530100", name: "昆明", pinyin: "kunming" },
      { code: "530300", name: "曲靖", pinyin: "qujing" },
      { code: "530400", name: "玉溪", pinyin: "yuxi" },
      { code: "530500", name: "保山", pinyin: "baoshan" },
      { code: "530600", name: "昭通", pinyin: "zhaotong" },
      { code: "530700", name: "丽江", pinyin: "lijiang" },
      { code: "530800", name: "普洱", pinyin: "puer" },
      { code: "530900", name: "临沧", pinyin: "lincang" },
      { code: "532300", name: "楚雄彝族自治州", pinyin: "chuxiong" },
      { code: "532500", name: "红河哈尼族彝族自治州", pinyin: "honghe" },
      { code: "532600", name: "文山壮族苗族自治州", pinyin: "wenshan" },
      { code: "532800", name: "西双版纳傣族自治州", pinyin: "xishuangbanna" },
      { code: "532900", name: "大理白族自治州", pinyin: "dali" },
      { code: "533100", name: "德宏傣族景颇族自治州", pinyin: "dehong" },
      { code: "533300", name: "怒江傈僳族自治州", pinyin: "nujiang" },
      { code: "533400", name: "迪庆藏族自治州", pinyin: "diqing" }
    ]
  },
  {
    code: "540000",
    name: "西藏",
    cities: [
      { code: "540100", name: "拉萨", pinyin: "lasa" },
      { code: "540200", name: "日喀则", pinyin: "rikaze" },
      { code: "540300", name: "昌都", pinyin: "changdu" },
      { code: "540400", name: "林芝", pinyin: "linzhi" },
      { code: "540500", name: "山南", pinyin: "shannan" },
      { code: "540600", name: "那曲", pinyin: "naqu" },
      { code: "542500", name: "阿里地区", pinyin: "ali" }
    ]
  },
  {
    code: "610000",
    name: "陕西",
    cities: [
      { code: "610100", name: "西安", pinyin: "xian" },
      { code: "610200", name: "铜川", pinyin: "tongchuan" },
      { code: "610300", name: "宝鸡", pinyin: "baoji" },
      { code: "610400", name: "咸阳", pinyin: "xianyang" },
      { code: "610500", name: "渭南", pinyin: "weinan" },
      { code: "610600", name: "延安", pinyin: "yanan" },
      { code: "610700", name: "汉中", pinyin: "hanzhong" },
      { code: "610800", name: "榆林", pinyin: "yulin2" },
      { code: "610900", name: "安康", pinyin: "ankang" },
      { code: "611000", name: "商洛", pinyin: "shangluo" }
    ]
  },
  {
    code: "620000",
    name: "甘肃",
    cities: [
      { code: "620100", name: "兰州", pinyin: "lanzhou" },
      { code: "620200", name: "嘉峪关", pinyin: "jiayuguan" },
      { code: "620300", name: "金昌", pinyin: "jinchang" },
      { code: "620400", name: "白银", pinyin: "baiyin" },
      { code: "620500", name: "天水", pinyin: "tianshui" },
      { code: "620600", name: "武威", pinyin: "wuwei" },
      { code: "620700", name: "张掖", pinyin: "zhangye" },
      { code: "620800", name: "平凉", pinyin: "pingliang" },
      { code: "620900", name: "酒泉", pinyin: "jiuquan" },
      { code: "621000", name: "庆阳", pinyin: "qingyang" },
      { code: "621100", name: "定西", pinyin: "dingxi" },
      { code: "621200", name: "陇南", pinyin: "longnan" },
      { code: "622900", name: "临夏回族自治州", pinyin: "linxia" },
      { code: "623000", name: "甘南藏族自治州", pinyin: "gannan" }
    ]
  },
  {
    code: "630000",
    name: "青海",
    cities: [
      { code: "630100", name: "西宁", pinyin: "xining" },
      { code: "630200", name: "海东", pinyin: "haidong" },
      { code: "632200", name: "海北藏族自治州", pinyin: "haibei" },
      { code: "632300", name: "黄南藏族自治州", pinyin: "huangnan" },
      { code: "632500", name: "海南藏族自治州", pinyin: "hainan" },
      { code: "632600", name: "果洛藏族自治州", pinyin: "guoluo" },
      { code: "632700", name: "玉树藏族自治州", pinyin: "yushu" },
      { code: "632800", name: "海西蒙古族藏族自治州", pinyin: "haixi" }
    ]
  },
  {
    code: "640000",
    name: "宁夏",
    cities: [
      { code: "640100", name: "银川", pinyin: "yinchuan" },
      { code: "640200", name: "石嘴山", pinyin: "shizuishan" },
      { code: "640300", name: "吴忠", pinyin: "wuzhong" },
      { code: "640400", name: "固原", pinyin: "guyuan" },
      { code: "640500", name: "中卫", pinyin: "zhongwei" }
    ]
  },
  {
    code: "650000",
    name: "新疆",
    cities: [
      { code: "650100", name: "乌鲁木齐", pinyin: "wulumuqi" },
      { code: "650200", name: "克拉玛依", pinyin: "kelamayi" },
      { code: "650400", name: "吐鲁番", pinyin: "tulufan" },
      { code: "650500", name: "哈密", pinyin: "hami" },
      { code: "652300", name: "昌吉回族自治州", pinyin: "changji" },
      { code: "652700", name: "博尔塔拉蒙古自治州", pinyin: "boertala" },
      { code: "652800", name: "巴音郭楞蒙古自治州", pinyin: "bayinguoleng" },
      { code: "652900", name: "阿克苏地区", pinyin: "akesu" },
      { code: "653000", name: "克孜勒苏柯尔克孜自治州", pinyin: "kezilesu" },
      { code: "653100", name: "喀什地区", pinyin: "kashi" },
      { code: "653200", name: "和田地区", pinyin: "hetian" },
      { code: "654000", name: "伊犁哈萨克自治州", pinyin: "yili" },
      { code: "654200", name: "塔城地区", pinyin: "tacheng" },
      { code: "654300", name: "阿勒泰地区", pinyin: "aletai" }
    ]
  },
  {
    code: "810000",
    name: "香港",
    cities: [{ code: "810100", name: "香港", pinyin: "xianggang" }]
  },
  {
    code: "820000",
    name: "澳门",
    cities: [{ code: "820100", name: "澳门", pinyin: "aomen" }]
  },
  {
    code: "710000",
    name: "台湾",
    cities: [
      { code: "710100", name: "台北", pinyin: "taibei" },
      { code: "710200", name: "高雄", pinyin: "gaoxiong" },
      { code: "710300", name: "台南", pinyin: "tainan" },
      { code: "710400", name: "台中", pinyin: "taizhong" }
    ]
  }
];

// 获取所有城市列表（不分省）
export function getAllCities(): City[] {
  return CHINA_CITIES.flatMap(province => 
    province.cities.map(city => ({
      ...city,
      provinceName: province.name
    }))
  );
}

// 搜索城市
export function searchCities(keyword: string): City[] {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return getAllCities().filter(city => 
    city.name.includes(keyword) || 
    city.pinyin.includes(lowerKeyword)
  );
}

// 热门城市
export const HOT_CITIES: City[] = [
  { code: "110100", name: "北京", pinyin: "beijing" },
  { code: "310100", name: "上海", pinyin: "shanghai" },
  { code: "440300", name: "深圳", pinyin: "shenzhen" },
  { code: "440100", name: "广州", pinyin: "guangzhou" },
  { code: "330100", name: "杭州", pinyin: "hangzhou" },
  { code: "320100", name: "南京", pinyin: "nanjing" },
  { code: "510100", name: "成都", pinyin: "chengdu" },
  { code: "420100", name: "武汉", pinyin: "wuhan" },
  { code: "610100", name: "西安", pinyin: "xian" },
  { code: "410100", name: "郑州", pinyin: "zhengzhou" },
  { code: "500100", name: "重庆", pinyin: "chongqing" },
  { code: "370200", name: "青岛", pinyin: "qingdao" }
];
