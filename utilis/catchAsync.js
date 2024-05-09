// catcing Async Errors so that for code readabily and DNRC(Do no repeat code)
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err)); // err get caught in next then it will be handler by global errr handling  middleware
  };
};
