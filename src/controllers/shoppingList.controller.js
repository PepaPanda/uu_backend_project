//Shopping list

export const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    res.json({ name });
  } catch (err) {
    next(err);
  }
};

export const getList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    res.json({ listId });
  } catch (err) {
    next(err);
  }
};

export const deleteList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    res.json({ listId });
  } catch (err) {
    next(err);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name, status } = req.body;
    res.json({ name, status, listId });
  } catch (err) {
    next(err);
  }
};

//Shopping list USERS
export const getListUsers = async (req, res, next) => {
  try {
    const { listId } = req.params;
    res.json({ listId });
  } catch (err) {
    next(err);
  }
};

export const removeListUser = async (req, res, next) => {
  try {
    const { listId, userId } = req.params;
    res.json({ listId, userId });
  } catch (err) {
    next(err);
  }
};

export const inviteListUser = async (req, res, next) => {
  try {
    const { listId, userId } = req.params;
    res.json({ listId, userId });
  } catch (err) {
    next(err);
  }
};

//Shopping list ITEMS
export const createListItem = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name } = req.body;
    res.json({ listId });
  } catch (err) {
    next(err);
  }
};

export const editListItem = async (req, res, next) => {
  try {
    const { listId, itemId } = req.params;
    const { name, resolved } = req.body;
    res.json({ listId, itemId, name, resolved });
  } catch (err) {
    next(err);
  }
};

export const deleteListItem = async (req, res, next) => {
  try {
    const { listId, itemId } = req.params;
    res.json({ listId, itemId });
  } catch (err) {
    next(err);
  }
};
