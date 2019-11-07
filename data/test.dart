import 'package:vidy_app/generated/i18n.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vidy_app/generated/data/index.dart';
import 'package:vidy_app/src/pages/home/repository/home_repository.dart';
import 'package:vidy_app/src/pages/home/repository/news_repository.dart';
import 'package:vidy_app/src/utils/network/api_state.dart';
import 'package:vidy_app/src/utils/share_preference/index.dart';
import 'package:vidy_app/src/utils/string_utils.dart';

class HomeViewModel extends ChangeNotifier{

  static HomeViewModel of(BuildContext context) =>
      Provider.of<HomeViewModel>(context);

  String keyword;

  NewsRepository _newsRepository = NewsRepository();
  HomeRepository _homeRepository = HomeRepository();

  ApiState<List<NewsItem>> _news = ApiUninitialized();
  ApiState<List<NewsItem>> get news => _news;

  ApiState _loadState;

  ApiState<HomeResp> _home = ApiUninitialized();
  ApiState<HomeResp> get home => _home;


  fetchCache(){
    try{
      // 新闻缓存需要区分用户！！不能用同一个key。 用token缓存
      var token = SpUtil.getString(SpKey.token);
      if(!StringUtils.isNullOrBlank(token)){
        List<NewsItem> newsCache = <NewsItem>[];
        List<Map> walletsMap = SpUtil.getObjectList("${SpKey.newsCache}#$token");
        walletsMap.forEach((map){
          newsCache.add(NewsItem.fromJson(map));
        });
        print('新闻缓存==$newsCache');
        if(newsCache != null && newsCache.isNotEmpty){
          return ApiLoaded<List<NewsItem>>(data: newsCache , page: 1);
        }
      }
    }catch(e){
      print('获取新闻缓存失败，e=$e');
    }
    return ApiUninitialized<List<NewsItem>>();
  }




  fetchHomeData(){
    _homeRepository.fetchHome().then((resp){
      _home = ApiLoaded(data: resp);
      notifyListeners();
    },onError: (e){
      _home = ApiError(message: e.toString());
      notifyListeners();
    });
  }

  String getReadNumber(){
    var stats = home;
    if(stats is ApiLoaded<HomeResp>) return stats.data?.user?.read?.toString() ?? "0";

    return "0";
  }

  String getFirstNotice(){
    var stats = home;
    if(stats is ApiLoaded<HomeResp>) return stats.data?.notice?.first?.title ?? "";

    return "";
  }

  List<NoticeResp> getNotice(){
    var stats = home;
    if(stats is ApiLoaded<HomeResp>) return stats.data?.notice;

    return null;
  }

  String getReadStatus(){
    var state = home;
    if(state is ApiLoaded<HomeResp>){
      if(state.data.user.read == 0){
        return S.of(context).theMinerIsUp;
      }else if(state.data.user.read >= 10){
        return S.of(context).finishTheJob;
      }else{
        return S.of(context).comeOnComeOn;
      }
    }

    return S.of(context).theMinerIsUp ;
  }

  fetchNews(){
    _loadState = ApiUninitialized();

    //分页的时候，如果第一页是缓存，然后滑动到底，会拿第二页的数据。。。。
    _news = fetchCache();

    _newsRepository.fetchNews(1, keyword: keyword).then((resp){
      _news = ApiLoaded(data: resp.data ,page: 1 ,hasReachedMax: resp.data.length < resp.perPage);
      _loadState = ApiLoaded();

      // 新闻缓存需要区分用户！！不能用同一个key。 用token缓存
      var token = SpUtil.getString(SpKey.token);
      if(!StringUtils.isNullOrBlank(token)){
        SpUtil.putObjectList("${SpKey.newsCache}#$token",  resp.data);
      }

      notifyListeners();
    }, onError: (e){
      print('加载新闻失败，e=$e');
      if(_news is ApiUninitialized){
        _news = ApiError(message: e.toString() , page: 1);
        _loadState = ApiError();
        notifyListeners();
      }
    });
  }

  fetchMoreNews(){
    if(_hasReachedMax(_news)){
      return;
    }

    if(_loadState is ApiUninitialized) return;

    _loadState = ApiUninitialized();


    _newsRepository.fetchNews(_news.page + 1 , keyword: keyword).then((resp){

      _news = resp.data.isEmpty
          ? (_news as ApiLoaded<List<NewsItem>>).copyWith(hasReachedMax: true)
          : ApiLoaded<List<NewsItem>>(
          page: _news.page + 1 ,
          data: ((_news as ApiLoaded).data as List<NewsItem>) + resp.data,
          hasReachedMax: resp.data.length < resp.perPage
      );
      _loadState = ApiLoaded();
      notifyListeners();

    }, onError: (e){
      _loadState = ApiError();
      print('加载新闻失败，e=$e');
      notifyListeners();
    });
  }


  ///是否已经加载完毕
  bool _hasReachedMax(ApiState state) =>
      state is ApiLoaded && state.hasReachedMax;

  void read(num id) {
    _newsRepository.read(id).then((resp){
        var state = _news;
        if(state is ApiLoaded<List<NewsItem>>){
          state.data.forEach((e){
            if(id == e.id){
              e.isRead = true;
            }
          });
          fetchHomeData();
//          notifyListeners();
        }
    }, onError: (e){

    });
  }

}