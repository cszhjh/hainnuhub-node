const labelService = require("../service/label.service");

class LeabelController {
  async create(ctx, next) {
    try {
      const { name } = ctx.request.body;
      const result = await labelService.create(name);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async list(ctx, next) {
    try {
      const { limit = 0, offset = 0 } = ctx.query;
      const result = await labelService.getLabels(limit, offset);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new LeabelController();
